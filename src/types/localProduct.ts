import { NutritionInfo } from './nutrition';

export interface LocalProduct {
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
  createdAt: string;
  updatedAt: string;
}

export interface LocalProductImport {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutrition: Partial<NutritionInfo>;
  allergens?: string[];
  categories?: string[];
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  ingredients?: string[];
  servingSize?: string;
  quantity?: string;
}

export function createDefaultNutrition(): NutritionInfo {
  return {
    calories: 0,
    sugar: 0,
    fat: 0,
    saturatedFat: 0,
    sodium: 0,
    protein: 0,
    fiber: 0,
    carbohydrates: 0,
  };
}

export function validateLocalProduct(product: Partial<LocalProduct>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!product.barcode || product.barcode.trim().length < 4) {
    errors.push('Barcode is required and must be at least 4 characters');
  }

  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!product.nutrition) {
    errors.push('Nutrition information is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeLocalProductImport(importData: LocalProductImport): LocalProduct {
  const now = new Date().toISOString();
  
  return {
    barcode: importData.barcode,
    name: importData.name,
    brand: importData.brand,
    imageUrl: importData.imageUrl,
    nutrition: {
      ...createDefaultNutrition(),
      ...importData.nutrition,
    },
    allergens: importData.allergens || [],
    categories: importData.categories || [],
    nutriScore: importData.nutriScore,
    ingredients: importData.ingredients || [],
    servingSize: importData.servingSize,
    quantity: importData.quantity,
    createdAt: now,
    updatedAt: now,
  };
}
