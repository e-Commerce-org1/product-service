export interface Response {
  code: number;
  status: string;
  timestamp: string;
  data: string;
  error: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  subCategory?: string | undefined;
  gender?: string | undefined;
  brand: string;
  imageUrl: string;
  description: string;
  price: number;
  totalStock: number;
  variants: Variant[];
}

export interface UpdateProductRequest {
  id: string;
  name?: string | undefined;
  category?: string | undefined;
  subCategory?: string | undefined;
  gender?: string | undefined;
  brand?: string | undefined;
  imageUrl?: string | undefined;
  description?: string | undefined;
  price?: number | undefined;
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
  page?: number | undefined;
  pageSize?: number | undefined;
  category?: string | undefined;
  brand?: string | undefined;
  subCategory?: string | undefined;
  name?: string | undefined;
  gender?: string | undefined;
}

export interface UpdateInventoryRequest {
  productId: string;
  variants: Variant[];
}

export interface side {
    brands : string[], 
    categories : string[],
    subCategories : string[],
    genders : string[],
    colors : string[],
    lowestPrice : number,
    highestPrice : number
}