export type Screen = 'home' | 'catalog' | 'checkout' | 'support' | 'auth' | 'admin';

export interface UserSession {
  id?: string;
  email: string;
  name: string;
  role?: 'admin' | 'cliente';
  preferredAssistiveTech?: string;
  highContrastDefault?: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'braille' | 'screen-reader' | 'input-assist' | 'magnifier';
  categoryLabel: string;
  shortCategory: 'Hardware' | 'Software Digital';
  icon: string;
  price: number;
  priceFormatted: string;
  priceType: string;
  image: string;
  imageAlt: string;
  badge: string;
  subBadge: string;
  description: string;
  specs: ProductSpec[];
  inStock: boolean;
  stockCount?: number;
  isDownload?: boolean;
  wcagLevel: 'aaa-native' | 'aria-compliant' | 'section508';
  inputMethod: 'keyboard' | 'gaze' | 'voice';
  featured?: boolean;
  contrastRatio?: string;
  warrantyInfo?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FilterState {
  categories: string[];
  wcagStandards: string[];
  inputMethods: string[];
  priceMin: number;
  priceMax: number;
  searchQuery: string;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'rating';
}

export type ContrastMode = 'normal' | 'inverse' | 'grayscale';

export interface AccessibilitySettings {
  contrast: ContrastMode;
  highlightLinks: boolean;
  fontSize: 100 | 120 | 140;
  textSpacing: boolean;
  hideImages: boolean;
  stopAnimations: boolean;
  largeCursor: boolean;
}

export interface AdminOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  totalAmountValue?: number;
  itemCount: number;
  date: string;
  createdAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cliente';
  registeredDate: string;
  ordersCount: number;
  totalSpent: string;
  status: 'active' | 'suspended';
}
