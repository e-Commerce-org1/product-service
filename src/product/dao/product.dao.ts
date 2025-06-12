import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "src/product/schema/product.schema";
import { Variant } from "src/product/schema/variant.schema";
import { CreateProductRequest, UpdateInventoryRequest, UpdateProductRequest } from "src/proto/product";
import { buildLooseSearchRegex, side, toArray } from "src/constants/const -function";
import { FilterProductsDto } from "../dto/filter-products.dto";
import { GrpcAppException } from "src/filters/GrpcAppException";
import { AppException } from "src/filters/AppException";


@Injectable()
export class productDao {
    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @InjectModel(Variant.name) private readonly variantModel: Model<Variant>,
    ) { }

    //  create product 
    async createProductDao(data: CreateProductRequest): Promise<Product> {
        if (!data.subCategory) {
            data.subCategory = data.category;
        }

        const newProduct = new this.productModel(data);

        const variants = await Promise.all(
            data.variants.map(v =>
                this.variantModel.create({
                    ...v,
                    productId: newProduct._id,
                })
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
            throw GrpcAppException.notFound('Product not found in updating!');
        }

        if (data.variants && data.variants.length > 0) {
            const productObjectId = new Types.ObjectId(data.id);
            await this.variantModel.deleteMany({ productId: productObjectId });

            const variants = await Promise.all(
                data.variants.map(v =>
                    this.variantModel.create({
                        ...v,
                        productId: updatedProduct._id
                    })
                )
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
            throw GrpcAppException.notFound(`Product not found with ID: ${id}`);
        }
        return product;
    }

    // List All the product based on filter
    async listProductsDao(filter: any): Promise<{ products: any[]; total: number }> {
        const page = parseInt(filter.page, 10) || 1;
        const pageSize = parseInt(filter.pageSize, 10) || 10;

        const orConditions: any[] = [];
        const allowedFields = ['brand', 'category', 'name', 'size', 'color'];

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
                throw GrpcAppException.notFound(`Product Not Found with ID: ${productObjectId}`);
            }
    
            await this.variantModel.deleteMany({
                productId: productObjectId
            });
    
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
            throw GrpcAppException.notFound(`Product Not Found with ID: ${productObjectId}`);
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


    // Http Request Logic
    async filterProducts(searchTerm: string, filterDto: FilterProductsDto) {
        const { category, subCategory, brand, page = 1, color, gender, price, sort } = filterDto;

        const limit = 10;
        const skip = (+page - 1) * limit;
        // Base query for searchTerm
        const searchRegex = buildLooseSearchRegex(searchTerm);
        const baseQuery = {
            $or: [
                { name: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { description: searchRegex},
                { gender : searchRegex }
            ]
        };

        // Additional filters from query parameters
        const additionalFilters: any = {};

        if (category) {
            additionalFilters.category = { $regex: category, $options: 'i' };
        }

        if (subCategory) {
            if (Array.isArray(subCategory)) {
                additionalFilters.subCategory = { 
                    $in: subCategory.map(val => new RegExp(val, 'i')) 
                };
            } else {
                additionalFilters.subCategory = { 
                    $regex: subCategory, $options: 'i' 
                };
            }
        }

        if (brand) {
            if (Array.isArray(brand)) {
                additionalFilters.brand = { 
                    $in: brand.map(val => new RegExp(val, 'i')) 
                };
            } else {
                additionalFilters.brand = { 
                    $regex: brand, $options: 'i' 
                };
            }
        }

        if (gender) {
            additionalFilters.gender = { $regex: `^${gender}$`, $options: 'i' }
        }

        const p = price?.split(",").map(Number);
        if (p && Array.isArray(p) && p.length === 2) {
            additionalFilters.price = {
                $gte: p[0],
                $lte: p[1]
            };
        }

        // Color filter inside variants
        if (color) {
            additionalFilters['variants.color'] = {
                $regex: new RegExp(color, 'i')
            };
        }

        const sortOptions: any = {};
        switch(sort) {
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
                sortOptions.createdAt = -1; // Default sort by newest
        }

        // Combined query
        const finalQuery = { ...baseQuery, ...additionalFilters };

        // Get paginated products
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

        // Fetch base results for sidebar metadata
        const allSearchResults = await this.productModel.find(baseQuery)
            .populate('variants')
            .lean();

        // Metadata extraction from base search results
        const brandSet = new Set<string>();
        const subCategorySet = new Set<string>();
        const categorySet = new Set<string>();
        const prices: number[] = [];
        const colorSet = new Set<string>();
        const genderSet = new Set<string>();

        for (const product of allSearchResults) {
            if (product.brand) brandSet.add(product.brand);
            if (product.subCategory) subCategorySet.add(product.subCategory);
            if (product.price) prices.push(product.price);
            if (product.gender) genderSet.add(product.gender);
            if (product.category) categorySet.add(product.category);

            if (product.variants) {
                product.variants.forEach(variant => {
                    if (variant.color) colorSet.add(variant.color);
                });
            }
        }

        let a = allSearchResults.length;
        if(category || subCategory || brand || color || gender || price){
            a = products.length;
        }

        // Prepared sidebar arrays
        const brands = Array.from(brandSet);
        const categories = Array.from(categorySet);
        const subCategories = Array.from(subCategorySet);
        const colors = Array.from(colorSet);
        const genders = Array.from(genderSet);

        const lowestPrice = prices.length ? Math.min(...prices) : null;
        const highestPrice = prices.length ? Math.max(...prices) : null;

        // Only include sidebar fields if not filtered and more than one value
        const sidebar : side = {
            brands : [],
            categories:[],
            subCategories:[],
            genders:[],
            colors:[],
            lowestPrice:0,
            highestPrice:0
        }

        
        if ( brands.length > 1 ) sidebar.brands = brands;
        if ( categories.length > 1 ) sidebar.categories = categories;
        if ( subCategories.length > 1)sidebar.subCategories = subCategories;
        if ( genders.length > 1) sidebar.genders = genders;
        if ( colors.length > 1 ) sidebar.colors = colors;
        if (lowestPrice !== null && highestPrice !== null && lowestPrice !== highestPrice) {
            sidebar.lowestPrice = lowestPrice;
            sidebar.highestPrice = highestPrice;
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
            throw AppException.notFound('Product not found!');
        }

        // Find similar products by brand, category, or subcategory (excluding the current product)
        const similarProducts = await this.productModel.find({
            _id: { $ne: product._id },
            $or: [
                { brand: product.brand },
                { category: product.category },
                { subCategory: product.subCategory },
                { gender : product.gender},
                ],
            })
            .select('-variants')
            .limit(10)
            .lean();

        return {
            product,
            similarProducts,
        };
    }
}