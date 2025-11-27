import React from 'react';

export enum Category {
  CLUBS = 'Clubs',
  BALLS = 'Balls',
  APPAREL = 'Apparel',
  ACCESSORIES = 'Accessories',
  TRAINING = 'Training Aids'
}

export type ThemeColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber';

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  dateAdded: string; // ISO Date string
  sku: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ACCRUAL';
  customerName?: string;
  customerAddress?: string;
  notes?: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalProfit: number;
  topSellingItems: { name: string; count: number }[];
}

// Component Props Interfaces
export interface BaseComponentProps {
  theme: ThemeColor;
}

export interface DashboardProps extends BaseComponentProps {
  products: Product[];
  transactions: Transaction[];
}

export interface InventoryProps extends BaseComponentProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onProductSave?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;
}

export interface SalesProps extends BaseComponentProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onTransactionComplete?: (transaction: Transaction) => void;
}

export interface ReportsProps extends BaseComponentProps {
  products: Product[];
  transactions: Transaction[];
}

export interface SettingsProps extends BaseComponentProps {
  scriptUrl: string;
  setScriptUrl: (url: string) => void;
  onRefreshData: () => Promise<boolean>;
}

export interface SidebarProps extends BaseComponentProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  setTheme: (theme: ThemeColor) => void;
}