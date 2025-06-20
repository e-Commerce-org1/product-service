import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Variant } from './variant.schema';
import { Review } from 'src/review/schemas/review.schema';

export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop({ default: false })
  isPrimary: boolean;
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true, index: true })
  subCategory: string;

  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ index: true })
  gender: string;

  @Prop({
    type: [ProductImage],
    required: true,
    default: [],
  })
  images: ProductImage[];

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  totalStock: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Variant' }],
    default: [],
  })
  variants: Variant[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Review' }],
    default: [],
  })
  reviews: Review[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
