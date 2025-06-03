import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "src/product/schema/product.schema";
import { Variant } from "src/product/schema/variant.schema";
import { CreateProductRequest, UpdateInventoryRequest, UpdateProductRequest } from "src/proto/product";
import { GrpcNotFoundException } from "src/filters/custom-exceptions";


@Injectable()
export class productDao {
    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @InjectModel(Variant.name) private readonly variantModel: Model<Variant>
    ) {}

    async createProductDao(data: CreateProductRequest): Promise<Product>{
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

    async updateProductDao(data: UpdateProductRequest): Promise<Product> {
        const updatePayload: any = {
            ...(data.name && { name: data.name }),
            ...(data.categoryName && { categoryName: data.categoryName }),
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

    async listProductsDao(filter: any): Promise<{ products: any[]; total: number }> {
        const page = filter.page || 1;
        const pageSize = filter.pageSize || 10;

        const query: any = {};
        if (filter.categoryName) {
            query.categoryName = { $regex: new RegExp(filter.categoryName, 'i') };
        }
        if (filter.brand) {
            query.brand = { $regex: new RegExp(filter.brand, 'i') };
        }

        const [products, total] = await Promise.all([
            this.productModel
                .find(query)
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('variants')
                .lean()
                .exec(),
            this.productModel.countDocuments(query).exec(),
        ]);

        return { products, total };
    }

    // deleting the product with variants by id
    async deleteProductDao(id: string ) {
        const productObjectId = new Types.ObjectId(id);
        
        await this.variantModel.deleteMany({ 
            productId: productObjectId 
        });

        const result = await this.productModel.findByIdAndDelete(id);

        if(!result) {
            throw new GrpcNotFoundException(`Product Not Found with ID:${id}`);
        }
        
        return {
            success: true,
            message: `Product ${id} deleted successfully`
        };
    }

    // Updating the stocks with productId
    async updateVariantsDao(data: UpdateInventoryRequest){
        const productObjectId = new Types.ObjectId(data.productId);
        console.log(data.productId, productObjectId);
        const productExists = await this.productModel.exists({ _id: productObjectId });

        if (!productExists) {
            throw new GrpcNotFoundException(`Product Not Found with ID: ${productObjectId}`);
        }

        // deleting the previous variants 
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
        
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

        // Update product's total stock and get updated document
        const updatedProduct = await this.productModel.findByIdAndUpdate(
            productObjectId,
            { totalStock },
            { new: true }
        ).populate('variants');
        
        return updatedProduct;
    }
            
}