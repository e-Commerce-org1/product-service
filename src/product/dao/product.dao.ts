import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from 'src/product/schema/product.schema';
import { Variant } from 'src/product/schema/variant.schema';
import {
  CreateProductRequest,
  InventoryChange,
  ProductFilter,
  Side,
  UpdateInventoryRequest,
  UpdateProductRequest,
} from 'src/interfaces/helper.interface';
import { buildLooseSearchRegex, toArray } from 'src/constants/helper.function';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { GrpcAppException } from 'src/filters/GrpcAppException';
import { AppException } from 'src/filters/AppException';
import { ERROR_MESSAGES } from 'src/constants/app.constants';

@Injectable()
export class ProductDao {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Variant.name) private readonly variantModel: Model<Variant>,
  ) {}

  /**
   * @description this method is for creating a product
   * @req payload with all the product details like imgaes and variants
   * @res new product
   */
  async createProductDao(data: CreateProductRequest): Promise<Product> {
    data.subCategory ??= data.category;
    const newProduct = new this.productModel(data);
    const variants = await Promise.all(
      data.variants.map((v) =>
        this.variantModel.create({ ...v, productId: newProduct._id }),
      ),
    );
    newProduct.variants = variants;
    newProduct.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    return newProduct.save();
  }

  /**
   * @description this method is for updating the product details
   * @req partial product details
   * @res updated product details
   */
  async updateProductDao(data: UpdateProductRequest): Promise<Product> {
    const updatePayload: Partial<Product> = {};
    const allowedFields = [
      'name',
      'category',
      'subCategory',
      'gender',
      'brand',
      'images',
      'description',
      'price',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === 'images' && data.images) {
          updatePayload[key] = data.images.map((img) => ({
            url: img.url,
            isPrimary: img.isPrimary,
          }));
        } else {
          updatePayload[key] = data[key];
        }
      }
    }
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(data.id, { $set: updatePayload }, { new: true })
      .exec();

    if (!updatedProduct) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (data.variants && data.variants.length > 0) {
      await this.variantModel.deleteMany({ productId: updatedProduct._id });

      const variants = await Promise.all(
        data.variants.map((v) =>
          this.variantModel.create({ ...v, productId: updatedProduct._id }),
        ),
      );

      updatedProduct.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      updatedProduct.variants = variants;
      await updatedProduct.save();
    }

    if (updatePayload.images) {
      const primaryCount = updatedProduct.images.filter(
        (img) => img.isPrimary,
      ).length;
      if (primaryCount < 1) {
        updatedProduct.images[0].isPrimary = true;
        await updatedProduct.save();
      }
    }
    return updatedProduct;
  }

  /**
   * @description this method is for getting product details By product ID
   * @req product ID
   * @res product details
   */
  async getProductDao(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('variants')
      .populate('reviews')
      .exec();

    if (!product) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  /**
   * @description this method for getting all the products
   * @req anything from the filter
   * @res all the filtered products
   */

  async listProductsDao(
    filter: ProductFilter,
  ): Promise<{ products: any[]; total: number }> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 10;

    const orConditions: any[] = [];
    const allowedFields = [
      'brand',
      'category',
      'subCategory',
      'name',
      'size',
      'color',
    ];

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

  /**
   * @description this method for delete product By ID
   * @req product ID
   * @res deleted product
   */
  async deleteProductDao(id: string) {
    const productObjectId = new Types.ObjectId(id);
    const exit = await this.productModel.exists({ _id: productObjectId });
    if (!exit) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_DELETE_NOT_FOUND);
    }

    await this.variantModel.deleteMany({ productId: productObjectId });
    const result = await this.productModel.findByIdAndDelete(id);
    return result;
  }

  /**
   * @description this method for updating the inventory
   * @req product ID and inventory details
   * @res all the filtered products
   */
  async updateVariantsDao(data: UpdateInventoryRequest) {
    const productObjectId = new Types.ObjectId(data.productId);
    const product = await this.productModel.findById({ _id: productObjectId });
    if (!product) {
      throw GrpcAppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    await this.variantModel.deleteMany({ productId: productObjectId });

    const variants = await Promise.all(
      data.variants.map((v) =>
        this.variantModel.create({
          size: v.size,
          color: v.color,
          stock: v.stock,
          productId: productObjectId,
        }),
      ),
    );
    product.variants = variants;
    product.totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    return product.save();
  }

  // Hanlde inventory update from the order
  async handleInventoryUpdate(
    items: InventoryChange[],
  ): Promise<{ updated: string[]; failed: string[] }> {
    const results: { updated: string[]; failed: string[] } = {
      updated: [],
      failed: [],
    };

    for (const item of items) {
      const quantityDelta = item.increase ? item.quantity : -item.quantity;
      // 1. Update Variant
      const variantFilter: any = {
        productId: new Types.ObjectId(item.productId),
        size: item.size,
        color: item.color,
      };

      // Prevent negative stock for decrement operations
      if (!item.increase) variantFilter.stock = { $gte: item.quantity };

      const updatedVariant = await this.variantModel.findOneAndUpdate(
        variantFilter,
        { $inc: { stock: quantityDelta } },
        { new: true },
      );

      if (!updatedVariant) {
        results.failed.push(item.productId);
        continue;
      }
      // 2. Update Product's totalStock
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { totalStock: quantityDelta },
      });
      results.updated.push(item.productId);
    }

    return results;
  }

  async filterProducts(searchTerm: string, filterDto: FilterProductsDto) {
    const {
      category,
      subCategory,
      brand,
      page = 1,
      color,
      gender,
      price,
      sort,
    } = filterDto;

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
          { gender: searchRegex },
        ],
      };
    }

    // Helper to build additional filters
    interface Filter {
      [key: string]: any;
    }

    const buildAdditionalFilters = (excludeKey?: string): Filter => {
      const filters: Filter = {};

      const addRegexFilter = (
        key: string,
        value: string,
        exactMatch = false,
      ) => {
        if (value && excludeKey !== key) {
          filters[key] = {
            $regex: exactMatch ? `^${value}$` : value,
            $options: 'i',
          };
        }
      };

      const addArrayRegexFilter = (key: string, value: string | string[]) => {
        if (value && excludeKey !== key) {
          filters[key] = Array.isArray(value)
            ? { $in: value.map((val) => new RegExp(val, 'i')) }
            : { $regex: value, $options: 'i' };
        }
      };

      if (category) addArrayRegexFilter('category', category);
      if (subCategory) addArrayRegexFilter('subCategory', subCategory);
      if (brand) addArrayRegexFilter('brand', brand);
      if (gender) addRegexFilter('gender', gender, true);
      if (color) addArrayRegexFilter('variants.color', color);

      if (price && excludeKey !== 'price') {
        const [min, max] = price.split(',').map(Number);
        if (min >= 0 && max >= min) {
          filters.price = { $gte: min, $lte: max };
        }
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
      this.productModel
        .find(finalQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('variants')
        .populate('reviews')
        .lean(),
      this.productModel.countDocuments(finalQuery),
    ]);

    // Helper for sidebar metadata: fetch all possible values for a filter, excluding that filter itself
    async function getSidebarOptions(field: string, excludeKey: string) {
      const query = { ...baseQuery, ...buildAdditionalFilters(excludeKey) };
      const docs = await (field === 'color'
        ? this.productModel.find(query).populate('variants').lean()
        : this.productModel.find(query).select(field).lean());
      if (field === 'color') {
        // Flatten and deduplicate colors
        const colorSet = new Set<string>();
        docs.forEach((doc) => {
          if (doc.variants) {
            doc.variants.forEach((variant) => {
              if (variant.color) colorSet.add(variant.color);
            });
          }
        });
        return Array.from(colorSet);
      } else {
        // Deduplicate other fields
        return Array.from(
          new Set(docs.map((doc) => doc[field]).filter(Boolean)),
        );
      }
    }

    // Fetch sidebar options for each filter type, excluding currently selected value(s)
    const [
      brands,
      categories,
      subCategories,
      genders,
      colors,
      priceRangeResults,
    ] = await Promise.all([
      getSidebarOptions.call(this, 'brand', 'brand'),
      getSidebarOptions.call(this, 'category', 'category'),
      getSidebarOptions.call(this, 'subCategory', 'subCategory'),
      getSidebarOptions.call(this, 'gender', 'gender'),
      getSidebarOptions.call(this, 'color', 'color'),
      // For price range, exclude price filter and collect all prices
      this.productModel
        .find({ ...baseQuery, ...buildAdditionalFilters('price') })
        .select('price')
        .lean(),
    ]);

    // Calculate lowest/highest price for sidebar
    const prices = priceRangeResults
      .map((p) => p.price)
      .filter((p) => typeof p === 'number');
    const lowestPrice = prices.length ? Math.min(...prices) : null;
    const highestPrice = prices.length ? Math.max(...prices) : null;

    // Only include sidebar fields if not filtered and more than one value
    const sidebar: Side = {
      brands: brands.length > 1 ? brands : [],
      categories: categories.length > 1 ? categories : [],
      subCategories: subCategories.length > 1 ? subCategories : [],
      genders: genders.length > 1 ? genders : [],
      colors: colors.length > 1 ? colors : [],
      lowestPrice:
        lowestPrice !== null &&
        highestPrice !== null &&
        lowestPrice !== highestPrice
          ? lowestPrice
          : 0,
      highestPrice:
        lowestPrice !== null &&
        highestPrice !== null &&
        lowestPrice !== highestPrice
          ? highestPrice
          : 0,
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
      sideBar: sidebar,
    };
  }

  async getProductWithSimilar(productId: string) {
    const product = await this.productModel
      .findById(productId)
      .populate('variants')
      .populate('reviews')
      .lean();

    if (!product) {
      throw AppException.notFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const similarProducts = await this.productModel
      .find({
        _id: { $ne: product._id },
        $or: [
          { brand: product.brand },
          { category: product.category },
          { subCategory: product.subCategory },
        ],
      })
      .populate('variants')
      .populate('reviews')
      .limit(10)
      .lean();

    return {
      product,
      similarProducts,
    };
  }
}
