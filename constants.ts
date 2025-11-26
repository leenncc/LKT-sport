import { Category, Product, Transaction, ThemeColor } from './types';

export const THEME_COLORS: Record<ThemeColor, {
  primary: string;
  hover: string;
  text: string;
  bgLight: string;
  border: string;
  ring: string;
  hex: string;
}> = {
  emerald: {
    primary: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-500',
    hex: '#059669'
  },
  blue: {
    primary: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'focus:ring-blue-500',
    hex: '#2563eb'
  },
  violet: {
    primary: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
    text: 'text-violet-600',
    bgLight: 'bg-violet-50',
    border: 'border-violet-200',
    ring: 'focus:ring-violet-500',
    hex: '#7c3aed'
  },
  rose: {
    primary: 'bg-rose-600',
    hover: 'hover:bg-rose-700',
    text: 'text-rose-600',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'focus:ring-rose-500',
    hex: '#e11d48'
  },
  amber: {
    primary: 'bg-amber-600',
    hover: 'hover:bg-amber-700',
    text: 'text-amber-600',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'focus:ring-amber-500',
    hex: '#d97706'
  }
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'DRV-TM-SIM2',
    name: 'TaylorMade SIM2 Driver',
    category: Category.CLUBS,
    costPrice: 300,
    sellingPrice: 529,
    quantity: 2,
    dateAdded: '2023-10-15T00:00:00.000Z', // Old item (risk of obsolescence)
  },
  {
    id: '2',
    sku: 'IRON-MZ-PRO',
    name: 'Mizuno Pro 223 Irons Set',
    category: Category.CLUBS,
    costPrice: 900,
    sellingPrice: 1399,
    quantity: 1,
    dateAdded: '2024-01-20T00:00:00.000Z',
  },
  {
    id: '3',
    sku: 'BALL-PROV1',
    name: 'Titleist Pro V1 (Dozen)',
    category: Category.BALLS,
    costPrice: 35,
    sellingPrice: 55,
    quantity: 24,
    dateAdded: '2024-05-01T00:00:00.000Z',
  },
  {
    id: '4',
    sku: 'GLV-FJ-ST',
    name: 'FootJoy StaSof Glove',
    category: Category.ACCESSORIES,
    costPrice: 12,
    sellingPrice: 25,
    quantity: 15,
    dateAdded: '2024-04-10T00:00:00.000Z',
  },
  {
    id: '5',
    sku: 'PUT-SC-NP2',
    name: 'Scotty Cameron Newport 2',
    category: Category.CLUBS,
    costPrice: 280,
    sellingPrice: 450,
    quantity: 3,
    dateAdded: '2023-11-01T00:00:00.000Z', // Older
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '101',
    date: '2024-05-10T14:30:00.000Z',
    items: [
      { productId: '3', productName: 'Titleist Pro V1 (Dozen)', quantity: 2, priceAtSale: 55 },
      { productId: '4', productName: 'FootJoy StaSof Glove', quantity: 1, priceAtSale: 25 }
    ],
    totalAmount: 135,
    paymentMethod: 'CASH',
  },
  {
    id: '102',
    date: '2024-05-11T10:15:00.000Z',
    items: [
      { productId: '1', productName: 'TaylorMade SIM2 Driver', quantity: 1, priceAtSale: 500 } // Sold at discount
    ],
    totalAmount: 500,
    paymentMethod: 'BANK_TRANSFER',
  }
];