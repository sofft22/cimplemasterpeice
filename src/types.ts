export type Variant = {
  label: string;
  priceDelta: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string;
  image_urls?: string[];
  in_stock: boolean;
  category_id: string;
  badge: string | null;
  cart_adds: number;
  sort_order?: number | null;
  variants?: {
    suggested: Variant[];
  };
};

export type ServiceVariant = {
  label: string;
  price: number;
  description?: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price?: number;
  image_url: string;
  image_urls?: string[];
  in_stock: boolean;
  variants?: ServiceVariant[];
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  time: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: string;
  variantPriceDelta?: number;
};