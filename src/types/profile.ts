import { AllergenCategory, BodyData, DailyNutritionTargets, DietGoal } from './nutrition';

export interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  goals: DietGoal[];
  allergenSelections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>;
  bodyData?: BodyData;
  dailyTargets?: DailyNutritionTargets;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  goals: DietGoal[];
  allergenSelections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>;
  restrictions: string[];
  familyMembers: FamilyMember[];
  bodyData?: BodyData;
  dailyTargets?: DailyNutritionTargets;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  name: string;
  goals: DietGoal[];
  allergenSelections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>;
  bodyData?: BodyData;
}
