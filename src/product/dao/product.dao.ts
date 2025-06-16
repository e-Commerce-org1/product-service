import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "src/product/schema/product.schema";
import { Variant } from "src/product/schema/variant.schema";
import { CreateProductRequest, InventoryChange, side, UpdateInventoryRequest, UpdateProductRequest } from "src/interfaces/helper.interface";
import { buildLooseSearchRegex, toArray } from "src/constants/helper.function";
import { FilterProductsDto } from "../dto/filter-products.dto";
import { GrpcAppException } from "src/filters/GrpcAppException";
import { AppException } from "src/filters/AppException";
import { ERROR_MESSAGES } from "src/constants/app.constants";


@Injectable()
export class ProductDao {
    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @InjectModel(Variant.name) private readonly variantModel: Model<Variant>,
    ) { }

    //  create product 
    async createProductDao(data: CreateProductRequest): Promise<Product> {
        if (!data.subCategory) data.subCategory = data.category;
        const newProduct = new this.productModel(data);
        const variants = await Promise.all(
            data.variants.map(v =>
                this.variantModel.create({ ...v, productId: newProduct._id })
            )
        );
        newProduct.variants = variants;
        newProduct.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        return newProduct.save();
    }

    // update the the product details
    async updateProductDao(data: UpdateProductRequest): Promise<Product> {
        const updatePayload: any = {
            ...(data.name && { name: data.name }),
            ...(data.category && { category: data.category }),
            ...(data.subCategory && { subCategory: data.subCategory}),
            ...(data.gender && { gender: data.gender}),
            ...(data.brand && { brand: data.brand }),
            ...(data.imageUrl && { imageUrl: data.imageUrl }),
            ...(data.description && { description: data.description }),
            ...(data.price && { price: data.price })
        };
        const updatedProduct = await this.productModel.findByIdAndUpdate(
            data.id,
            { $set: updatePayload },
            { new: true }
        )

        if (!updatedProduct) {
            throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (data.variants && data.variants.length > 0) {
            const productObjectId = new Types.ObjectId(data.id);
            await this.variantModel.deleteMany({ productId: productObjectId });

            const variants = await Promise.all(
                data.variants.map( v => this.variantModel.create({ ...v, productId: updatedProduct._id }))
            )

            updatedProduct.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
            updatedProduct.variants = variants;
            await updatedProduct.save();
        }
        return updatedProduct;
    }

    // Get Product By Id
    async getProductDao(id: string): Promise<Product> {
        const product = await this.productModel.findById(id)
            .populate('variants')
            .lean()
            .exec();

        if (!product) {
            throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }
        return product;
    }

    // List All the product based on filter
    async listProductsDao(filter: any): Promise<{ products: any[]; total: number }> {
        const page = parseInt(filter.page, 10) || 1;
        const pageSize = parseInt(filter.pageSize, 10) || 10;

        const orConditions: any[] = [];
        const allowedFields = ['brand', 'category', 'subCategory', 'name', 'size', 'color'];

        for (const key of allowedFields) {
            const values = toArray(filter[key]);
            if (values.length > 0) {
                if (key === 'name') {
                    // Add each name as a separate regex match (partial, case-insensitive)
                    for (const val of values) {
                        orConditions.push({ name: { $regex: val, $options: 'i' } });
                    }
                } else {
                    // Use $in for brand and categoryName
                    orConditions.push({ [key]: { $in: values } });
                }
            }
        }

        const mongoQuery = orConditions.length > 0 ? { $or: orConditions } : {};

        const [products, total] = await Promise.all([
            this.productModel
                .find(mongoQuery)
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('variants')
                .lean()
                .exec(),
            this.productModel.countDocuments(mongoQuery).exec(),
        ]);

        return { products, total };
    }

    // deleting the product with variants by id
    async deleteProductDao(id: string) {
        try{
            const productObjectId = new Types.ObjectId(id);
            const exit = await this.productModel.exists({ _id: productObjectId });
            if (!exit) {
                throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_DELETE_NOT_FOUND);
            }
    
            await this.variantModel.deleteMany({ productId: productObjectId });
            const result = await this.productModel.findByIdAndDelete(id);
            return result;
        }
        catch(error){
            throw error
        }
    }

    // Updating the stocks with productId
    async updateVariantsDao(data: UpdateInventoryRequest) {
        const productObjectId = new Types.ObjectId(data.productId);
        const product = await this.productModel.findById({ _id: productObjectId });
        if (!product) {
            throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        await this.variantModel.deleteMany({ productId: productObjectId });

        const variants = await Promise.all(
            data.variants.map(v =>
                this.variantModel.create({
                    size: v.size,
                    color: v.color,
                    stock: v.stock,
                    productId: productObjectId
                })
            )
        );
        product.variants = variants;
        product.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

        return product.save();
    }

    async handleInventoryUpdate(items: InventoryChange[]): Promise<{ updated: string[]; failed: string[] }> {
        const results :  { updated: string[]; failed: string[] } = {
            updated: [],
            failed: []
        };

        for (const item of items) {
            try {
                const quantityDelta = item.increase ? item.quantity : -item.quantity;
                
                // 1. Update Variant
                const variantFilter: any = {
                    productId: new Types.ObjectId(item.productId),
                    size: item.size,
                    color: item.color
                };

                // Prevent negative stock for decrement operations
                if (!item.increase) {
                    variantFilter.stock = { $gte: item.quantity };
                }

                const updatedVariant = await this.variantModel.findOneAndUpdate(
                    variantFilter,
                    { $inc: { stock: quantityDelta } },
                    { new: true }
                );

                if (!updatedVariant) {
                    results.failed.push(item.productId);
                    continue;
                }

                // 2. Update Product's totalStock
                await this.productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { totalStock: quantityDelta } }
                );

                results.updated.push(item.productId);
            } catch (error) {
                results.failed.push(item.productId);
            }
        }

        return results;
    }


    async filterProducts(searchTerm: string, filterDto: FilterProductsDto) {
        const { category, subCategory, brand, page = 1, color, gender, price, sort } = filterDto;

        const limit = 15;
        const skip = (page - 1) * limit;

        const isSearchAll = searchTerm?.toLowerCase() === 'all';
        let baseQuery = {};

        if (!isSearchAll) {
            const searchRegex = buildLooseSearchRegex(searchTerm);
            baseQuery = {
                $or: [
                    { name: searchRegex },
                    { brand: searchRegex },
                    { category: searchRegex },
                    { subCategory: searchRegex },
                    { description: searchRegex },
                    { gender: searchRegex }
                ]
            };
        }

        // Helper to build additional filters
        const buildAdditionalFilters = (excludeKey?: string) => {
            const filters: any = {};
            if (category && excludeKey !== 'category') {
                filters.category = { $regex: category, $options: 'i' };
            }
            if (subCategory && excludeKey !== 'subCategory') {
                if (Array.isArray(subCategory)) {
                    filters.subCategory = { $in: subCategory.map(val => new RegExp(val, 'i')) };
                } else {
                    filters.subCategory = { $regex: subCategory, $options: 'i' };
                }
            }
            if (brand && excludeKey !== 'brand') {
                if (Array.isArray(brand)) {
                    filters.brand = { $in: brand.map(val => new RegExp(val, 'i')) };
                } else {
                    filters.brand = { $regex: brand, $options: 'i' };
                }
            }
            if (gender && excludeKey !== 'gender') {
                filters.gender = { $regex: `^${gender}$`, $options: 'i' };
            }
            const p = price?.split(",").map(Number);
            if (p && Array.isArray(p) && p.length === 2 && excludeKey !== 'price') {
                filters.price = { $gte: p[0], $lte: p[1] };
            }
            if (color && excludeKey !== 'color') {
                filters['variants.color'] = { $regex: new RegExp(color, 'i') };
            }
            return filters;
        };

        // Sorting options
        const sortOptions: any = {};
        switch (sort) {
            case 'rating':
                sortOptions.averageRating = -1;
                break;
            case 'price_asc':
                sortOptions.price = 1;
                break;
            case 'price_desc':
                sortOptions.price = -1;
                break;
            case 'new':
                sortOptions.createdAt = -1;
                break;
            default:
                sortOptions.createdAt = -1;
        }

        // Main query (all filters applied)
        const finalQuery = { ...baseQuery, ...buildAdditionalFilters() };

        // Get paginated products and total count
        const [products, total] = await Promise.all([
            this.productModel.find(finalQuery)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('variants')
                .populate('reviews')
                .lean(),
            this.productModel.countDocuments(finalQuery)
        ]);

        // Helper for sidebar metadata: fetch all possible values for a filter, excluding that filter itself
        async function getSidebarOptions(field: string, excludeKey: string) {
            let query = { ...baseQuery, ...buildAdditionalFilters(excludeKey) };
            let docs = await (field === 'color'
                ? this.productModel.find(query).populate('variants').lean()
                : this.productModel.find(query).select(field).lean()
            );
            if (field === 'color') {
                // Flatten and deduplicate colors
                const colorSet = new Set<string>();
                docs.forEach(doc => {
                    if (doc.variants) {
                        doc.variants.forEach(variant => {
                            if (variant.color) colorSet.add(variant.color);
                        });
                    }
                });
                return Array.from(colorSet);
            } else {
                // Deduplicate other fields
                return Array.from(new Set(docs.map(doc => doc[field]).filter(Boolean)));
            }
        }

        // Fetch sidebar options for each filter type, excluding currently selected value(s)
        const [
            brands,
            categories,
            subCategories,
            genders,
            colors,
            priceRangeResults
        ] = await Promise.all([
            getSidebarOptions.call(this, 'brand', 'brand'),
            getSidebarOptions.call(this, 'category', 'category'),
            getSidebarOptions.call(this, 'subCategory', 'subCategory'),
            getSidebarOptions.call(this, 'gender', 'gender'),
            getSidebarOptions.call(this, 'color', 'color'),
            // For price range, exclude price filter and collect all prices
            this.productModel.find({ ...baseQuery, ...buildAdditionalFilters('price') }).select('price').lean()
        ]);

        // Calculate lowest/highest price for sidebar
        const prices = priceRangeResults.map(p => p.price).filter(p => typeof p === 'number');
        const lowestPrice = prices.length ? Math.min(...prices) : null;
        const highestPrice = prices.length ? Math.max(...prices) : null;

        // Only include sidebar fields if not filtered and more than one value
        const sidebar: side = {
            brands: brands.length > 1 ? brands : [],
            categories: categories.length > 1 ? categories : [],
            subCategories: subCategories.length > 1 ? subCategories : [],
            genders: genders.length > 1 ? genders : [],
            colors: colors.length > 1 ? colors : [],
            lowestPrice: (lowestPrice !== null && highestPrice !== null && lowestPrice !== highestPrice) ? lowestPrice : 0,
            highestPrice: (lowestPrice !== null && highestPrice !== null && lowestPrice !== highestPrice) ? highestPrice : 0
        };

        // Total products for sidebar: if any filter is selected, use filtered total, else use all search results count
        let a = total;
        if (!category && !subCategory && !brand && !color && !gender && !price) {
            a = await this.productModel.countDocuments(baseQuery);
        }

        return {
            products,
            totalProducts: a,
            skip,
            limit,
            sideBar : sidebar
        };
    }



    async getProductWithSimilar(productId: string) {
        const product = await this.productModel.findById(productId).populate('variants').populate('reviews').lean();

        if (!product) {
            throw AppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
        }

        // Find similar products by brand, category, or subcategory (excluding the current product)
        const similarProducts = await this.productModel.find({
            _id: { $ne: product._id },
            $or: [
                { brand: product.brand },
                { category: product.category },
                { subCategory: product.subCategory },
                ],
            })
            .select('-variants')
            .populate('reviews')
            .limit(10)
            .lean();

        return {
            product,
            similarProducts,
        };
    }
}