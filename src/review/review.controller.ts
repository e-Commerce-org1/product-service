import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ReviewsService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';

@Controller('products/reviews/:productId')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(productId, createReviewDto);
  }

  @Get()
  async findAll(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }
}

