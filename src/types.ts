export type PrintServiceId = 'bw-single' | 'bw-double' | 'colour' | 'photo';

export interface PrintServiceRate {
  id: PrintServiceId;
  title: string;
  sub: string;
  rate: number;
  unit: 'page' | 'sheet';
  icon: string;
  badge?: string;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: string | number;
  type: string;
  pageCount?: number;
  bwPages?: number;
  colorPages?: number;
  colorPageList?: number[];
  printMode?: 'hybrid' | 'all-color' | 'all-bw';
  serviceId?: string;
  copies?: number;
  paperSize?: 'A4' | 'A3' | 'Legal';
  layout?: 'Portrait' | 'Landscape';
  dataUrl?: string;
  url?: string;
  isAnalyzing?: boolean;
}

export type OrderStatus = 'pending' | 'printing' | 'completed' | 'cancelled';

export interface PrintOrder {
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: PrintServiceId;
  serviceTitle: string;
  rate: number;
  unit: 'page' | 'sheet';
  copies: number;
  pageRange: string;
  paperSize: 'A4' | 'A3' | 'Legal';
  orientation: 'Portrait' | 'Landscape';
  binding: 'none' | 'spiral' | 'hard' | 'lamination';
  bindingCost: number;
  notes: string;
  deliveryAddress: string;
  files: UploadedDoc[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  avatarUrl?: string;
  role: 'student' | 'receiver' | 'admin';
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'deletion' | 'security' | 'system';
  read: boolean;
  createdAt: string;
  relatedOrderId?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  addressLine: string;
  isDefault: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking';
  title: string;
  maskedInfo: string;
  isDefault: boolean;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    order: boolean;
    whatsapp: boolean;
    securityAlerts: boolean;
    promotional: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  languageAndRegion: {
    language: string;
    country: string;
    currency: string;
    currencySymbol: string;
    timeZone: string;
    dateFormat: string;
  };
  privacy: {
    profileVisibility: 'public' | 'campus' | 'private';
    dataSharing: boolean;
    personalizedRecommendations: boolean;
    activityTracking: boolean;
  };
  addresses: SavedAddress[];
  paymentMethods: SavedPaymentMethod[];
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: number;
}
