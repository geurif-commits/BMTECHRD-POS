export const LicenseStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED'
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
} as const;

export const OrderItemStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED'
} as const;

export const ProductType = {
  FOOD: 'FOOD',
  DRINK: 'DRINK'
} as const;

export const TableStatus = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  CLEANING: 'CLEANING'
} as const;

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  MIXED: 'MIXED'
} as const;

export type LicenseStatusType = typeof LicenseStatus[keyof typeof LicenseStatus];
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type OrderItemStatusType = typeof OrderItemStatus[keyof typeof OrderItemStatus];
export type ProductTypeType = typeof ProductType[keyof typeof ProductType];
export type TableStatusType = typeof TableStatus[keyof typeof TableStatus];
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
