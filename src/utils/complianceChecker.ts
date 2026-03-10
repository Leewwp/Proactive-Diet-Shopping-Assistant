import { checkAllergenMatch } from '@/constants';
import {
  AlertInfo,
  AllergenCategory,
  FamilyMember,
  NutritionThreshold,
  Product,
  UserProfile,
} from '@/types';
import { getCombinedThresholds } from './nutritionThresholds';

export function checkAllergenConflictFromSelections(
  product: Product,
  allergenSelections: Record<
    AllergenCategory,
    {
      categoryId: AllergenCategory;
      selectedSubItems: string[];
      isAllSelected: boolean;
    }
  >
): { hasConflict: boolean; conflictingAllergens: string[]; riskLevel: 'high' | 'low' | 'none' } {
  const productKeywords = [...product.allergens, ...product.categories, product.name, product.brand || ''].filter(
    Boolean
  );
  const result = checkAllergenMatch(allergenSelections, productKeywords);

  if (result.matched) {
    return {
      hasConflict: true,
      conflictingAllergens: result.category ? [result.category.name] : [],
      riskLevel: result.category?.riskLevel || 'low',
    };
  }

  return {
    hasConflict: false,
    conflictingAllergens: [],
    riskLevel: 'none',
  };
}

export function checkNutritionThresholds(
  product: Product,
  thresholds: NutritionThreshold
): { violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  const { nutrition } = product;

  if (thresholds.calories?.max && nutrition.calories > thresholds.calories.max) {
    violations.push(`Calories: ${nutrition.calories}kcal (max: ${thresholds.calories.max}kcal)`);
  } else if (thresholds.calories?.max && nutrition.calories > thresholds.calories.max * 0.8) {
    warnings.push(`Calories: ${nutrition.calories}kcal (approaching limit)`);
  }

  if (thresholds.sugar?.max && nutrition.sugar > thresholds.sugar.max) {
    violations.push(`Sugar: ${nutrition.sugar}g (max: ${thresholds.sugar.max}g)`);
  } else if (thresholds.sugar?.max && nutrition.sugar > thresholds.sugar.max * 0.8) {
    warnings.push(`Sugar: ${nutrition.sugar}g (approaching limit)`);
  }

  if (thresholds.fat?.max && nutrition.fat > thresholds.fat.max) {
    violations.push(`Fat: ${nutrition.fat}g (max: ${thresholds.fat.max}g)`);
  } else if (thresholds.fat?.max && nutrition.fat > thresholds.fat.max * 0.8) {
    warnings.push(`Fat: ${nutrition.fat}g (approaching limit)`);
  }

  if (thresholds.sodium?.max && nutrition.sodium > thresholds.sodium.max) {
    violations.push(`Sodium: ${nutrition.sodium}g (max: ${thresholds.sodium.max}g)`);
  } else if (thresholds.sodium?.max && nutrition.sodium > thresholds.sodium.max * 0.8) {
    warnings.push(`Sodium: ${nutrition.sodium}g (approaching limit)`);
  }

  if (thresholds.protein?.min && nutrition.protein < thresholds.protein.min) {
    violations.push(`Protein: ${nutrition.protein}g (min: ${thresholds.protein.min}g)`);
  }

  return { violations, warnings };
}

export function checkVegetarianCompliance(product: Product): boolean {
  const excludedCategories = ['meat', 'poultry', 'fish', 'seafood', 'beef', 'pork', 'chicken', 'lamb'];
  const productCategoriesLower = product.categories.map((category) => category.toLowerCase());
  return !excludedCategories.some((excludedCategory) =>
    productCategoriesLower.some((category) => category.includes(excludedCategory))
  );
}

export function determineAlertLevel(product: Product, profile: UserProfile): AlertInfo {
  const thresholds = getCombinedThresholds(profile.goals);
  const allergenCheck = checkAllergenConflictFromSelections(product, profile.allergenSelections);

  if (allergenCheck.hasConflict) {
    const riskPrefix = allergenCheck.riskLevel === 'high' ? 'High risk: ' : '';
    return {
      level: 'emergency',
      message: `${riskPrefix}Contains ${allergenCheck.conflictingAllergens.join(', ')}. Matches your allergen list.`,
      productId: product.barcode,
      productName: product.name,
    };
  }

  if (profile.goals.includes('vegetarian') && !checkVegetarianCompliance(product)) {
    return {
      level: 'emergency',
      message: 'Not vegetarian. Contains meat or fish related ingredients.',
      productId: product.barcode,
      productName: product.name,
    };
  }

  const nutritionCheck = checkNutritionThresholds(product, thresholds);

  if (nutritionCheck.violations.length > 0) {
    return {
      level: 'suggestion',
      message: `High in: ${nutritionCheck.violations[0]}`,
      productId: product.barcode,
      productName: product.name,
    };
  }

  if (nutritionCheck.warnings.length > 0) {
    return {
      level: 'optimization',
      message: nutritionCheck.warnings[0],
      productId: product.barcode,
      productName: product.name,
    };
  }

  return {
    level: 'compliant',
    message: 'This product meets your dietary goals',
    productId: product.barcode,
    productName: product.name,
  };
}

export function checkFamilyConflicts(
  product: Product,
  familyMembers: FamilyMember[]
): { member: FamilyMember; alert: AlertInfo }[] {
  const conflicts: { member: FamilyMember; alert: AlertInfo }[] = [];

  familyMembers.forEach((member) => {
    const thresholds = getCombinedThresholds(member.goals);
    const allergenCheck = checkAllergenConflictFromSelections(product, member.allergenSelections);

    if (allergenCheck.hasConflict) {
      conflicts.push({
        member,
        alert: {
          level: allergenCheck.riskLevel === 'high' ? 'emergency' : 'suggestion',
          message: `Contains ${allergenCheck.conflictingAllergens.join(', ')}. Allergen risk for ${member.name}.`,
          productId: product.barcode,
          productName: product.name,
        },
      });
      return;
    }

    const nutritionCheck = checkNutritionThresholds(product, thresholds);
    if (nutritionCheck.violations.length > 0) {
      conflicts.push({
        member,
        alert: {
          level: 'suggestion',
          message: `Conflicts with ${member.name} goal: ${member.goals[0] || 'custom'}.`,
          productId: product.barcode,
          productName: product.name,
        },
      });
    }
  });

  return conflicts;
}

export function calculateOverallComplianceScore(products: Product[], profile: UserProfile): number {
  if (products.length === 0) {
    return 100;
  }

  let totalScore = 0;

  products.forEach((product) => {
    const alert = determineAlertLevel(product, profile);
    switch (alert.level) {
      case 'compliant':
        totalScore += 100;
        break;
      case 'optimization':
        totalScore += 80;
        break;
      case 'suggestion':
        totalScore += 50;
        break;
      case 'emergency':
        totalScore += 0;
        break;
      default:
        totalScore += 0;
    }
  });

  return Math.round(totalScore / products.length);
}
