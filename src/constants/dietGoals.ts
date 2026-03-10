import { DietGoal, Gender } from '@/types';

export const DIET_GOAL_LABELS: Record<DietGoal, string> = {
  fat_loss: 'Fat Loss',
  muscle_gain: 'Muscle Gain',
  sugar_control: 'Sugar Control',
  low_sodium: 'Low Sodium',
  vegetarian: 'Vegetarian',
  custom: 'Custom',
};

export const DIET_GOAL_DESCRIPTIONS: Record<DietGoal, (bodyData?: { weight?: number; gender?: Gender }) => string> = {
  fat_loss: (bodyData) => {
    const targets = bodyData?.weight
      ? `~${Math.round(bodyData.weight * 0.8)} kcal/day for weight loss`
      : '~1600 kcal/day for weight loss';
    return `Reduce calories and fat intake. ${targets}`;
  },
  muscle_gain: (bodyData) => {
    const targets = bodyData?.weight
      ? `~${Math.round(bodyData.weight * 35)}g protein/day`
      : '~80g protein/day';
    return `High protein, moderate calories. ${targets}`;
  },
  sugar_control: () => 'Limit sugar and added sugars. Low glycemic diet for blood sugar control.',
  low_sodium: () => 'Reduce sodium intake. Heart-healthy low sodium diet.',
  vegetarian: () => 'Exclude meat and fish. Plant-based protein sources.',
  custom: () => 'Set your own preferences.',
};

export const GOAL_THRESHOLDS = {
  fat_loss: {
    calories: { max: 200 },
    fat: { max: 10 },
    sugar: { max: 8 },
  },
  muscle_gain: {
    protein: { min: 15 },
    calories: { max: 250 },
  },
  sugar_control: {
    sugar: { max: 5 },
    addedSugar: { max: 3 },
  },
  low_sodium: {
    sodium: { max: 0.3 },
  },
  vegetarian: {},
  custom: {},
};

export const VEGETARIAN_EXCLUDED_CATEGORIES = [
  'meat',
  'poultry',
  'fish',
  'seafood',
  'beef',
  'pork',
  'chicken',
  'lamb',
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
