import { AlertLevel, NutritionInfo } from './nutrition';

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutrition: NutritionInfo;
  allergens: string[];
  categories: string[];
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  ingredients?: string[];
  servingSize?: string;
  quantity?: string;
  isAIIdentified?: boolean;
  confidence?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  addedAt: string;
  assignedTo?: string[];
}

export interface CartNutritionSummary {
  totalCalories: number;
  totalSugar: number;
  totalSodium: number;
  totalFat: number;
  totalProtein: number;
  totalFiber: number;
  itemCount: number;
  complianceScore: number;
  alerts: AlertInfo[];
}

export interface AlertInfo {
  level: AlertLevel;
  message: string;
  productId: string;
  productName: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

export interface ComparisonResult {
  productA: Product;
  productB: Product;
  winner: 'A' | 'B' | 'tie';
  alignmentScore: number;
  metrics: ComparisonMetric[];
}

export interface ComparisonMetric {
  name: string;
  valueA: number;
  valueB: number;
  statusA: 'better' | 'worse' | 'neutral';
  statusB: 'better' | 'worse' | 'neutral';
  unit: string;
}

export interface ScannedProduct extends Product {
  scannedAt: string;
}
