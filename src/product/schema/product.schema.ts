import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Variant } from './variant.schema';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  categoryName: string;

  @Prop({ required: true, index: true })
  brand: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  totalStock: number;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'Variant' }],
    default: []
  })
  variants: Variant[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
