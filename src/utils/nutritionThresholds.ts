import { GOAL_THRESHOLDS } from '@/constants';
import { DietGoal, NutritionInfo, NutritionThreshold } from '@/types';

export const DAILY_VALUES = {
  calories: 2000,
  sugar: 50,
  fat: 65,
  sodium: 2.3,
  protein: 50,
  fiber: 25,
  carbohydrates: 300,
};

export function getThresholdForGoal(goal: DietGoal): NutritionThreshold {
  return GOAL_THRESHOLDS[goal] || {};
}

export function getCombinedThresholds(goals: DietGoal[]): NutritionThreshold {
  const combined: NutritionThreshold = {};

  goals.forEach((goal) => {
    const threshold = getThresholdForGoal(goal);
    Object.entries(threshold).forEach(([key, value]) => {
      if (!combined[key as keyof NutritionThreshold]) {
        combined[key as keyof NutritionThreshold] = {};
      }
      const existing = combined[key as keyof NutritionThreshold];
      if (value.max !== undefined) {
        if (existing!.max === undefined || value.max < existing!.max) {
          existing!.max = value.max;
        }
      }
      if (value.min !== undefined) {
        if (existing!.min === undefined || value.min > existing!.min) {
          existing!.min = value.min;
        }
      }
    });
  });

  return combined;
}

export function checkNutritionValue(
  value: number,
  threshold: { max?: number; min?: number } | undefined
): 'compliant' | 'warning' | 'violation' {
  if (!threshold) return 'compliant';

  if (threshold.max !== undefined && value > threshold.max) {
    return 'violation';
  }

  if (threshold.min !== undefined && value < threshold.min) {
    return 'violation';
  }

  if (threshold.max !== undefined && value > threshold.max * 0.8) {
    return 'warning';
  }

  return 'compliant';
}

export function calculateDailyPercentage(value: number, dailyValue: number): number {
  return Math.round((value / dailyValue) * 100);
}

export function getNutritionColor(percentage: number): string {
  if (percentage < 50) return '#4CAF50';
  if (percentage < 80) return '#FF9800';
  return '#F44336';
}

export function getMeterColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio < 0.5) return '#4CAF50';
  if (ratio < 0.8) return '#FF9800';
  return '#F44336';
}

export function formatNutritionValue(value: number, unit: string): string {
  if (value >= 1000 && unit === 'mg') {
    return `${(value / 1000).toFixed(1)}g`;
  }
  return `${value.toFixed(1)}${unit}`;
}

export function calculateNutritionScore(
  nutrition: NutritionInfo,
  thresholds: NutritionThreshold
): number {
  let score = 100;

  const checkThreshold = (
    value: number,
    threshold: { max?: number; min?: number } | undefined,
    weight: number = 1
  ) => {
    if (!threshold) return;
    if (threshold.max !== undefined && value > threshold.max) {
      score -= weight * 20;
    } else if (threshold.max !== undefined && value > threshold.max * 0.8) {
      score -= weight * 10;
    }
    if (threshold.min !== undefined && value < threshold.min) {
      score -= weight * 15;
    }
  };

  checkThreshold(nutrition.calories, thresholds.calories, 1.5);
  checkThreshold(nutrition.sugar, thresholds.sugar, 1.2);
  checkThreshold(nutrition.fat, thresholds.fat, 1);
  checkThreshold(nutrition.sodium, thresholds.sodium, 1);
  checkThreshold(nutrition.protein, thresholds.protein, 0.8);

  return Math.max(0, Math.min(100, score));
}
