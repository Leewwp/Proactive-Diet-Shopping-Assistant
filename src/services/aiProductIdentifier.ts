import { Product } from '@/types';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AIProductIdentificationResult {
  productName: string;
  brand?: string;
  category: string;
  estimatedNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    sugar: number;
    sodium: number;
  };
  confidence: number;
  possibleBarcodes?: string[];
  allergenWarnings?: string[];
}

const DEFAULT_CONFIG: Partial<AIConfig> = {
  provider: 'openai',
  model: 'gpt-4o',
  baseUrl: 'https://api.openai.com/v1',
};

const SYSTEM_PROMPT = `You are a food product identification assistant. Analyze the image and identify the food product.

IMPORTANT: You must respond ONLY with a valid JSON object, no markdown formatting, no code blocks, just pure JSON.

The JSON structure must be:
{
  "productName": "Full product name in English",
  "brand": "Brand name if visible",
  "category": "Food category (e.g., beverage, snack, dairy, cereal, etc.)",
  "estimatedNutrition": {
    "calories": number (per 100g),
    "protein": number (g per 100g),
    "fat": number (g per 100g),
    "carbohydrates": number (g per 100g),
    "sugar": number (g per 100g),
    "sodium": number (mg per 100g)
  },
  "confidence": number (0-1),
  "possibleBarcodes": ["array of possible barcode numbers if visible"],
  "allergenWarnings": ["array of potential allergens based on ingredients visible"]
}

Guidelines:
- If you cannot identify the product clearly, set confidence below 0.5
- Estimate nutrition based on similar products if exact values are not visible
- List all potential allergens you can identify
- If the image is not a food product, set confidence to 0 and productName to "Not a food product"
- Always provide realistic nutrition estimates based on the product type`;

function getAIConfig(): AIConfig | null {
  return {
    provider: 'openai',
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    model: process.env.EXPO_PUBLIC_AI_MODEL || 'gpt-4o',
    baseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL || 'https://api.openai.com/v1',
  };
}

export async function identifyProductFromImage(
  imageBase64: string,
  config?: Partial<AIConfig>
): Promise<AIProductIdentificationResult | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config } as AIConfig;
  
  if (!finalConfig.apiKey) {
    console.warn('AI API key not configured');
    return null;
  }

  try {
    let response: Response;
    
    if (finalConfig.provider === 'openai' || finalConfig.provider === 'custom') {
      response = await fetch(`${finalConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: finalConfig.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Identify this food product and provide nutrition information:',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });
    } else if (finalConfig.provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': finalConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: finalConfig.model || 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: `${SYSTEM_PROMPT}\n\nIdentify this food product and provide nutrition information.`,
                },
              ],
            },
          ],
        }),
      });
    } else {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    let content: string;
    if (finalConfig.provider === 'anthropic') {
      content = data.content?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', content);
      return null;
    }

    const result: AIProductIdentificationResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error identifying product:', error);
    return null;
  }
}

export function convertAIResultToProduct(
  result: AIProductIdentificationResult,
  imageUri?: string
): Product {
  return {
    barcode: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: result.productName,
    brand: result.brand,
    imageUrl: imageUri,
    nutrition: {
      calories: result.estimatedNutrition.calories,
      protein: result.estimatedNutrition.protein,
      fat: result.estimatedNutrition.fat,
      saturatedFat: result.estimatedNutrition.fat * 0.3,
      sugar: result.estimatedNutrition.sugar,
      sodium: result.estimatedNutrition.sodium,
      carbohydrates: result.estimatedNutrition.carbohydrates,
      fiber: 0,
    },
    allergens: result.allergenWarnings || [],
    categories: [result.category],
    ingredients: [],
    isAIIdentified: true,
    confidence: result.confidence,
  };
}

export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!(config?.apiKey);
}

export function getAIProviderName(): string {
  const config = getAIConfig();
  if (!config?.apiKey) return 'Not configured';
  return config.provider || 'OpenAI';
}

export { getAIConfig };
