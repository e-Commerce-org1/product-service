import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "src/product/schema/product.schema";
import { Variant } from "src/product/schema/variant.schema";
import { CreateProductRequest, UpdateInventoryRequest, UpdateProductRequest } from "src/proto/product";
import { GrpcNotFoundException } from "src/filters/custom-exceptions";
import { toArray } from "src/constants/const -function";


@Injectable()
export class productDao {
    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @InjectModel(Variant.name) private readonly variantModel: Model<Variant>
    ) {}

    //  create product 
    async createProductDao(data: CreateProductRequest): Promise<Product>{
        if(!data.subCategory){
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
            throw new GrpcNotFoundException('Product not found in updating the product');
        }
        
        if(data.variants && data.variants.length > 0) {
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
    async getProductDao(id : string) : Promise<Product> {
        const product = await this.productModel.findById(id)
            .populate('variants')
            .lean()
            .exec();
  
        if (!product) {
            throw new GrpcNotFoundException(`Product not found with ID${id}`);
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
    async deleteProductDao(id: string ) {
        const productObjectId = new Types.ObjectId(id);
        
        const exit = await this.productModel.exists({_id: productObjectId});
        if(!exit){
            return null;
        }

        await this.variantModel.deleteMany({ 
            productId: productObjectId 
        });

        const result = await this.productModel.findByIdAndDelete(id);
        return result;
    }

    // Updating the stocks with productId
    async updateVariantsDao(data: UpdateInventoryRequest){
        const productObjectId = new Types.ObjectId(data.productId);
        const product = await this.productModel.findById({ _id: productObjectId });
        if (!product) {
            throw new GrpcNotFoundException(`Product Not Found with ID: ${productObjectId}`);
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
}