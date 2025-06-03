import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.schema';

@Schema({ timestamps: true })
export class Variant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Product;

  @Prop({ required: true, index: true })
  size: string;

  @Prop({ required: true, index: true })
  color: string;

  @Prop({ required: true, min: 0 })
  stock: number;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
