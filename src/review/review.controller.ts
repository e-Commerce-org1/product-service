import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ReviewsService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('products/reviews/:productId')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('/')
  @ApiOperation({ summary: 'Add review for the product' })
  async create(
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    try{
      return this.reviewsService.createReview(productId, createReviewDto);
    } catch( error ){
      return {
        code : 404,
        message: "Product Not Found"
      }
    }
  }
}

