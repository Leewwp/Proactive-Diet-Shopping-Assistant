export type DietGoal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'sugar_control'
  | 'low_sodium'
  | 'vegetarian'
  | 'custom';

export type AlertLevel = 'emergency' | 'suggestion' | 'optimization' | 'compliant';

export type Gender = 'male' | 'female' | 'other';

export interface BodyData {
  weight?: number;
  height?: number;
  age?: number;
  gender?: Gender;
}

export interface NutritionInfo {
  calories: number;
  sugar: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  protein: number;
  fiber: number;
  carbohydrates: number;
  addedSugar?: number;
}

export interface NutritionThreshold {
  calories?: { max?: number; min?: number };
  sugar?: { max?: number; min?: number };
  fat?: { max?: number; min?: number };
  sodium?: { max?: number; min?: number };
  protein?: { max?: number; min?: number };
  addedSugar?: { max?: number; min?: number };
}

export interface DailyNutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  sugar: number;
  sodium: number;
  fiber: number;
}

export interface GoalThresholds {
  [key: string]: NutritionThreshold;
}

export type AllergenCategory = 
  | 'peanuts'
  | 'tree_nuts'
  | 'fish'
  | 'shellfish'
  | 'eggs'
  | 'dairy'
  | 'gluten'
  | 'sesame'
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'meat'
  | 'other';

export type AllergenRiskLevel = 'high' | 'low';

export interface AllergenSubItem {
  id: string;
  name: string;
  keywords: string[];
}

export interface AllergenCategoryData {
  id: AllergenCategory;
  name: string;
  icon: string;
  riskLevel: AllergenRiskLevel;
  subItems: AllergenSubItem[];
}

export interface UserAllergenSelection {
  categoryId: AllergenCategory;
  selectedSubItems: string[];
  isAllSelected: boolean;
}

export type AllergenSelections = Record<AllergenCategory, UserAllergenSelection>;
