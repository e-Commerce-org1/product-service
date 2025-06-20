import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { Product } from '../product/schema/product.schema';
import { CreateReviewDto } from './dto/review.dto';
import { AppException } from 'src/filters/AppException';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async createReview(productId: string, createReviewDto: CreateReviewDto) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw AppException.notFound('Product Not Found during post review');
    }

    const review = new this.reviewModel({
      productId,
      ...createReviewDto,
    });

    await review.save();

    await this.productModel.findByIdAndUpdate(
      productId,
      { $push: { reviews: review._id } },
      { new: true },
    );

    return review;
  }
}
