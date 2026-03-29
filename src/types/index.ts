export * from './nutrition';
export * from './product';
export * from './profile';
export * from './localProduct';

export interface AlternativeProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutrition: import('./nutrition').NutritionInfo;
  allergens: string[];
  categories: string[];
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  improvementScore: number;
  improvements: string[];
  isRecommended: boolean;
}
