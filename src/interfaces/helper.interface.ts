export interface Response {
  code: number;
  status: string;
  timestamp: string;
  data: string;
  error: string;
}

export interface ProductImage {
  url: string;
  isPrimary: boolean;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  subCategory?: string;
  gender?: string;
  brand: string;
  images: ProductImage[];
  description: string;
  price: number;
  totalStock: number;
  variants: Variant[];
}

export interface UpdateProductRequest {
  id: string;
  name?: string;
  category?: string;
  subCategory?: string;
  gender?: string;
  brand?: string;
  images: ProductImage[];
  description?: string;
  price?: number;
  variants: Variant[];
}

export interface Variant {
  size: string;
  color: string;
  stock: number;
}

export interface ProductID {
  id: string;
}

export interface ProductFilter {
  page?: number;
  pageSize?: number;
  category?: string;
  brand?: string;
  subCategory?: string;
  name?: string;
  gender?: string;
}

export interface UpdateInventoryRequest {
  productId: string;
  variants: Variant[];
}

export interface Side {
  brands: string[];
  categories: string[];
  subCategories: string[];
  genders: string[];
  colors: string[];
  lowestPrice: number;
  highestPrice: number;
}

export interface UpdateInventoryByOrderRequest {
  items: InventoryChange[];
}

export interface InventoryChange {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  increase: boolean;
}
