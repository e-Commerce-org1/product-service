import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "src/product/schema/product.schema";
import { Variant } from "src/product/schema/variant.schema";
import { CreateProductRequest, UpdateInventoryRequest, UpdateProductRequest } from "src/proto/product";
import { toArray } from "src/constants/const -function";
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
        const { category, subCategory, brand } = filterDto;
        // console.log(searchTerm);
        // Base query for searchTerm
        const searchRegex = new RegExp(searchTerm, 'i');
        const baseQuery = {
            $or: [
                { name: searchRegex },
                { brand: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { description: searchRegex}
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

        // Combined query
        const finalQuery = { ...baseQuery, ...additionalFilters };

        // Fetch filtered products
        const products = await this.productModel.find(finalQuery)
            .populate('variants')
            .lean();

        // Fetch base results for sidebar metadata
        const allSearchResults = await this.productModel.find(baseQuery)
            .populate('variants')
            .lean();

        // Metadata extraction from base search results
        const brandSet = new Set<string>();
        const subCategorySet = new Set<string>();
        const prices: number[] = [];
        const colorSet = new Set<string>();

        for (const product of allSearchResults) {
            if (product.brand) brandSet.add(product.brand);
            if (product.subCategory) subCategorySet.add(product.subCategory);
            if (product.price) prices.push(product.price);
            
            if (product.variants) {
                product.variants.forEach(variant => {
                    if (variant.color) colorSet.add(variant.color);
                });
            }
        }

        return {
            products,
            totalProducts: products.length,
            sideBar: {
                brands: Array.from(brandSet),
                subCategories: Array.from(subCategorySet),
                lowestPrice: prices.length ? Math.min(...prices) : null,
                highestPrice: prices.length ? Math.max(...prices) : null,
                colors: Array.from(colorSet)
            }
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