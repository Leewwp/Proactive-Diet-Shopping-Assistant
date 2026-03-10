import { AlertInfo, Product, UserProfile } from '@/types';
import { checkNutritionThresholds, determineAlertLevel } from '@/utils/complianceChecker';
import { calculateNutritionScore, getCombinedThresholds } from '@/utils/nutritionThresholds';

export interface NutritionAnalysis {
  score: number;
  alert: AlertInfo;
  thresholdViolations: string[];
  thresholdWarnings: string[];
  recommendations: string[];
}

export function analyzeProduct(
  product: Product,
  profile: UserProfile
): NutritionAnalysis {
  const thresholds = getCombinedThresholds(profile.goals);
  const alert = determineAlertLevel(product, profile);
  const score = calculateNutritionScore(product.nutrition, thresholds);
  const { violations, warnings } = checkNutritionThresholds(product, thresholds);

  const recommendations: string[] = [];

  if (product.nutrition.sugar > 10) {
    recommendations.push('Consider a product with lower sugar content');
  }

  if (product.nutrition.sodium > 0.5) {
    recommendations.push('This product is high in sodium');
  }

  if (product.nutrition.fat > 15) {
    recommendations.push('Look for lower-fat alternatives');
  }

  if (product.nutrition.protein < 5 && profile.goals.includes('muscle_gain')) {
    recommendations.push('This product is low in protein for muscle gain goals');
  }

  return {
    score,
    alert,
    thresholdViolations: violations,
    thresholdWarnings: warnings,
    recommendations,
  };
}

export function analyzeComparison(
  productA: Product,
  productB: Product,
  profile: UserProfile
): {
  winner: 'A' | 'B' | 'tie';
  alignmentScore: number;
  analysis: NutritionAnalysis[];
} {
  const analysisA = analyzeProduct(productA, profile);
  const analysisB = analyzeProduct(productB, profile);

  let winner: 'A' | 'B' | 'tie' = 'tie';

  if (analysisA.score > analysisB.score + 10) {
    winner = 'A';
  } else if (analysisB.score > analysisA.score + 10) {
    winner = 'B';
  }

  const alignmentScore = Math.max(analysisA.score, analysisB.score);

  return {
    winner,
    alignmentScore,
    analysis: [analysisA, analysisB],
  };
}

export function getNutritionGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'E';
}

export function calculateDailyValuePercentage(
  value: number,
  dailyValue: number
): number {
  return Math.round((value / dailyValue) * 100);
}

export function getNutritionStatus(
  percentage: number
): 'low' | 'moderate' | 'high' {
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'moderate';
  return 'high';
}
