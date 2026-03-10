import { Product, UserProfile } from '@/types';
import { analyzeProduct } from './nutritionAnalyzer';
import { findAlternatives as apiFindAlternatives } from './openFoodFactsApi';

export interface AlternativeProduct extends Product {
  improvementScore: number;
  improvements: string[];
  isRecommended: boolean;
}

export async function findBetterAlternatives(
  product: Product,
  profile: UserProfile
): Promise<AlternativeProduct[]> {
  const currentAnalysis = analyzeProduct(product, profile);

  const alternatives = await apiFindAlternatives(
    product,
    profile.goals.includes('sugar_control') ? 5 : undefined,
    profile.goals.includes('low_sodium') ? 0.3 : undefined,
    profile.goals.includes('muscle_gain') ? 15 : undefined
  );

  const scoredAlternatives: AlternativeProduct[] = alternatives.map((alt) => {
    const altAnalysis = analyzeProduct(alt, profile);
    const improvementScore = altAnalysis.score - currentAnalysis.score;

    const improvements: string[] = [];

    if (alt.nutrition.sugar < product.nutrition.sugar) {
      improvements.push(`Lower sugar: ${alt.nutrition.sugar.toFixed(1)}g vs ${product.nutrition.sugar.toFixed(1)}g`);
    }

    if (alt.nutrition.sodium < product.nutrition.sodium) {
      improvements.push(`Lower sodium: ${alt.nutrition.sodium.toFixed(2)}g vs ${product.nutrition.sodium.toFixed(2)}g`);
    }

    if (alt.nutrition.calories < product.nutrition.calories) {
      improvements.push(`Fewer calories: ${alt.nutrition.calories} vs ${product.nutrition.calories}`);
    }

    if (alt.nutrition.protein > product.nutrition.protein) {
      improvements.push(`More protein: ${alt.nutrition.protein.toFixed(1)}g vs ${product.nutrition.protein.toFixed(1)}g`);
    }

    if (alt.nutriScore && product.nutriScore) {
      const scoreOrder = ['A', 'B', 'C', 'D', 'E'];
      if (scoreOrder.indexOf(alt.nutriScore) < scoreOrder.indexOf(product.nutriScore)) {
        improvements.push(`Better Nutri-Score: ${alt.nutriScore} vs ${product.nutriScore}`);
      }
    }

    return {
      ...alt,
      improvementScore,
      improvements,
      isRecommended: improvementScore > 0,
    };
  });

  return scoredAlternatives
    .filter((alt) => alt.improvementScore > 0 || alt.improvements.length > 0)
    .sort((a, b) => b.improvementScore - a.improvementScore)
    .slice(0, 5);
}

export function rankAlternatives(
  alternatives: AlternativeProduct[],
  profile: UserProfile
): AlternativeProduct[] {
  return alternatives.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return b.improvementScore - a.improvementScore;
  });
}
