export const packageName = 'product';

export const grpcService = 'ProductService';

export const grpcMethods = {
  create: 'CreateProduct',
  update: 'UpdateProduct',
  get: 'GetProduct',
  getList: 'ListProducts',
  delete: 'DeleteProduct',
  updateVariants: 'UpdateInventory',
  updateInventory: 'UpdateInventoryByOrderRequest',
};

export const RESPONSE_CODES = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
};

export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
};

export const MESSAGES = {
  PRODUCT_NOT_CREATED: 'Product not created, something went wrong',
  PRODUCT_UPDATE_ERROR: 'While updating, something went wrong!',
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_DELETE_ERROR: 'Product not found or deleted',
  VARIANT_UPDATE_ERROR: 'While updating variants, something went wrong!',
  INVENTORY_UPDATE_ERROR: 'Error while updating the inventory',
};
