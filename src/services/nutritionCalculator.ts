import { BodyData, DailyNutritionTargets, DietGoal } from '@/types';

const DEFAULT_BODY_DATA: Required<BodyData> = {
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male',
};

export function calculateBMR(bodyData?: BodyData): number {
  const { weight, height, age, gender } = {
    ...DEFAULT_BODY_DATA,
    ...bodyData,
  };

  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export function calculateTDEE(bodyData?: BodyData, activityLevel: number = 1.55): number {
  const bmr = calculateBMR(bodyData);
  return Math.round(bmr * activityLevel);
}

export function calculateDailyNutritionTargets(
  bodyData?: BodyData,
  goals: DietGoal[] = []
): DailyNutritionTargets {
  const effectiveBodyData = {
    ...DEFAULT_BODY_DATA,
    ...bodyData,
  };

  const { weight, gender } = effectiveBodyData;
  const tdee = calculateTDEE(effectiveBodyData);

  let targetCalories = tdee;
  let proteinPerKg = 0.8;
  let fatPercentage = 0.30;
  let carbsPercentage = 0.50;
  let maxSugar = 50;
  let maxSodium = 2300;
  let fiberTarget = gender === 'male' ? 38 : 25;

  goals.forEach((goal) => {
    switch (goal) {
      case 'fat_loss':
        targetCalories = Math.round(tdee * 0.8);
        proteinPerKg = 1.6;
        fatPercentage = 0.25;
        carbsPercentage = 0.45;
        maxSugar = 25;
        break;
      case 'muscle_gain':
        targetCalories = Math.round(tdee * 1.15);
        proteinPerKg = 2.0;
        fatPercentage = 0.25;
        carbsPercentage = 0.50;
        break;
      case 'sugar_control':
        maxSugar = 24;
        carbsPercentage = 0.40;
        fiberTarget = gender === 'male' ? 40 : 30;
        break;
      case 'low_sodium':
        maxSodium = 1500;
        break;
      case 'vegetarian':
        proteinPerKg = 1.2;
        break;
    }
  });

  const protein = Math.round(weight * proteinPerKg);
  const fatCalories = targetCalories * fatPercentage;
  const fat = Math.round(fatCalories / 9);
  const carbCalories = targetCalories * carbsPercentage;
  const carbohydrates = Math.round(carbCalories / 4);

  return {
    calories: targetCalories,
    protein,
    fat,
    carbohydrates,
    sugar: maxSugar,
    sodium: maxSodium,
    fiber: fiberTarget,
  };
}

export function getPer100gThresholds(
  dailyTargets: DailyNutritionTargets,
  mealsPerDay: number = 3
): Record<string, { max?: number; min?: number }> {
  const perMealMultiplier = 1 / mealsPerDay;
  const per100gMultiplier = 0.5;

  return {
    calories: {
      max: Math.round(dailyTargets.calories * perMealMultiplier * per100gMultiplier),
    },
    sugar: {
      max: Math.round(dailyTargets.sugar * perMealMultiplier * per100gMultiplier),
    },
    fat: {
      max: Math.round(dailyTargets.fat * perMealMultiplier * per100gMultiplier),
    },
    sodium: {
      max: Math.round((dailyTargets.sodium / 1000) * perMealMultiplier * per100gMultiplier * 100) / 100,
    },
    protein: {
      min: Math.round(dailyTargets.protein * perMealMultiplier * per100gMultiplier * 0.5),
      max: Math.round(dailyTargets.protein * perMealMultiplier * per100gMultiplier * 2),
    },
  };
}

export function getGoalDescription(goal: DietGoal, bodyData?: BodyData): string {
  const targets = calculateDailyNutritionTargets(bodyData, [goal]);

  switch (goal) {
    case 'fat_loss':
      return `Daily target: ${targets.calories} kcal, ${targets.protein}g protein. Calorie deficit for weight loss.`;
    case 'muscle_gain':
      return `Daily target: ${targets.calories} kcal, ${targets.protein}g protein. High protein for muscle building.`;
    case 'sugar_control':
      return `Daily sugar limit: ${targets.sugar}g. Low glycemic diet for blood sugar control.`;
    case 'low_sodium':
      return `Daily sodium limit: ${targets.sodium}mg. Heart-healthy low sodium diet.`;
    case 'vegetarian':
      return `Plant-based diet. Daily protein target: ${targets.protein}g from vegetarian sources.`;
    default:
      return `Daily target: ${targets.calories} kcal, ${targets.protein}g protein.`;
  }
}

export function formatBodyDataSummary(bodyData?: BodyData): string {
  if (!bodyData || !bodyData.weight) {
    return 'Not set (using default: 70kg adult male)';
  }

  const parts: string[] = [];
  if (bodyData.weight) parts.push(`${bodyData.weight}kg`);
  if (bodyData.height) parts.push(`${bodyData.height}cm`);
  if (bodyData.age) parts.push(`${bodyData.age}yrs`);
  if (bodyData.gender) parts.push(bodyData.gender);

  return parts.join(', ');
}
