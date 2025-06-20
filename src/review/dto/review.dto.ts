import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Name of Reviewer' })
  @IsString()
  @IsNotEmpty({ message: 'Reviewer name is required' })
  @Length(2, 50, {
    message: 'Reviewer name must be between 2 and 50 characters',
  })
  reviewerName: string;

  @ApiProperty({ description: 'Title of the review' })
  @IsString()
  @IsNotEmpty({ message: 'Review title is required' })
  @Length(3, 100, { message: 'Title must be between 5 and 100 characters' })
  title: string;

  @ApiProperty({ description: 'Description of review' })
  @IsString()
  @IsNotEmpty({ message: 'Comment is required' })
  @Length(10, 1000, {
    message: 'Comment must be between 10 and 1000 characters',
  })
  comment: string;

  @ApiProperty({ description: 'Rating of product' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;
}
