import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true, ref: 'Product' })
  productId: string;

  @Prop({ default: 'user' })
  reviewerName: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  comment: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
