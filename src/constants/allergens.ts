import { AllergenCategory, AllergenCategoryData } from '@/types';

export const ALLERGEN_CATEGORIES: AllergenCategoryData[] = [
  {
    id: 'peanuts',
    name: 'Peanuts',
    icon: '🥜',
    riskLevel: 'high',
    subItems: [
      { id: 'peanut_whole', name: 'Peanut (whole)', keywords: ['peanut', 'groundnut'] },
      { id: 'peanut_butter', name: 'Peanut Butter', keywords: ['peanut butter'] },
      { id: 'peanut_oil', name: 'Peanut Oil', keywords: ['peanut oil', 'arachis oil'] },
      { id: 'peanut_pieces', name: 'Peanut Pieces', keywords: ['peanut pieces', 'crushed peanut'] },
      { id: 'peanut_snacks', name: 'Peanut Snacks', keywords: ['peanut snack'] },
    ],
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    icon: '🌰',
    riskLevel: 'high',
    subItems: [
      { id: 'walnut', name: 'Walnut', keywords: ['walnut'] },
      { id: 'almond', name: 'Almond', keywords: ['almond'] },
      { id: 'cashew', name: 'Cashew', keywords: ['cashew'] },
      { id: 'pistachio', name: 'Pistachio', keywords: ['pistachio'] },
      { id: 'hazelnut', name: 'Hazelnut', keywords: ['hazelnut', 'filbert'] },
      { id: 'pine_nut', name: 'Pine Nut', keywords: ['pine nut', 'pinenut'] },
      { id: 'macadamia', name: 'Macadamia', keywords: ['macadamia'] },
      { id: 'pecan', name: 'Pecan', keywords: ['pecan'] },
      { id: 'brazil_nut', name: 'Brazil Nut', keywords: ['brazil nut'] },
      { id: 'ginkgo', name: 'Ginkgo Nut', keywords: ['ginkgo', 'white nut'] },
    ],
  },
  {
    id: 'fish',
    name: 'Fish',
    icon: '🐟',
    riskLevel: 'high',
    subItems: [
      { id: 'salmon', name: 'Salmon', keywords: ['salmon'] },
      { id: 'tuna', name: 'Tuna', keywords: ['tuna'] },
      { id: 'cod', name: 'Cod', keywords: ['cod'] },
      { id: 'sea_bass', name: 'Sea Bass', keywords: ['sea bass', 'seabass'] },
      { id: 'crucian_carp', name: 'Crucian Carp', keywords: ['crucian carp', '鲫鱼'] },
      { id: 'carp', name: 'Carp', keywords: ['carp', '鲤鱼'] },
      { id: 'grass_carp', name: 'Grass Carp', keywords: ['grass carp', '草鱼'] },
      { id: 'hairtail', name: 'Hairtail', keywords: ['hairtail', '带鱼'] },
      { id: 'yellow_croaker', name: 'Yellow Croaker', keywords: ['yellow croaker', '黄花鱼'] },
      { id: 'eel', name: 'Eel', keywords: ['eel', '鳗鱼'] },
      { id: 'sardine', name: 'Sardine', keywords: ['sardine'] },
    ],
  },
  {
    id: 'shellfish',
    name: 'Shellfish & Crustaceans',
    icon: '🦐',
    riskLevel: 'high',
    subItems: [
      { id: 'shrimp', name: 'Shrimp', keywords: ['shrimp', 'prawn'] },
      { id: 'crayfish', name: 'Crayfish', keywords: ['crayfish', '小龙虾'] },
      { id: 'crab', name: 'Crab', keywords: ['crab'] },
      { id: 'lobster', name: 'Lobster', keywords: ['lobster'] },
      { id: 'oyster', name: 'Oyster', keywords: ['oyster', '牡蛎'] },
      { id: 'scallop', name: 'Scallop', keywords: ['scallop', '扇贝'] },
      { id: 'clam', name: 'Clam', keywords: ['clam', '蛤蜊'] },
      { id: 'razor_clam', name: 'Razor Clam', keywords: ['razor clam', '蛏子'] },
      { id: 'abalone', name: 'Abalone', keywords: ['abalone', '鲍鱼'] },
      { id: 'conch', name: 'Conch', keywords: ['conch', '海螺'] },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: '🥚',
    riskLevel: 'high',
    subItems: [
      { id: 'chicken_egg', name: 'Chicken Egg', keywords: ['egg', 'chicken egg'] },
      { id: 'duck_egg', name: 'Duck Egg', keywords: ['duck egg'] },
      { id: 'goose_egg', name: 'Goose Egg', keywords: ['goose egg'] },
      { id: 'quail_egg', name: 'Quail Egg', keywords: ['quail egg'] },
      { id: 'century_egg', name: 'Century Egg', keywords: ['century egg', '皮蛋'] },
      { id: 'salted_egg', name: 'Salted Egg', keywords: ['salted egg', '咸蛋'] },
      { id: 'mayonnaise', name: 'Mayonnaise', keywords: ['mayonnaise', 'mayo'] },
      { id: 'egg_bakery', name: 'Egg-containing Bakery', keywords: ['egg bakery'] },
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy',
    icon: '🥛',
    riskLevel: 'high',
    subItems: [
      { id: 'cow_milk', name: 'Cow Milk', keywords: ['milk', 'cow milk'] },
      { id: 'goat_milk', name: 'Goat Milk', keywords: ['goat milk'] },
      { id: 'milk_powder', name: 'Milk Powder', keywords: ['milk powder', 'powdered milk'] },
      { id: 'cheese', name: 'Cheese', keywords: ['cheese'] },
      { id: 'butter', name: 'Butter', keywords: ['butter'] },
      { id: 'yogurt', name: 'Yogurt', keywords: ['yogurt', 'yoghurt'] },
      { id: 'cream', name: 'Cream', keywords: ['cream'] },
      { id: 'condensed_milk', name: 'Condensed Milk', keywords: ['condensed milk', '炼乳'] },
      { id: 'dairy_dessert', name: 'Dairy Dessert', keywords: ['dairy dessert'] },
    ],
  },
  {
    id: 'gluten',
    name: 'Gluten (Wheat)',
    icon: '🌾',
    riskLevel: 'high',
    subItems: [
      { id: 'wheat', name: 'Wheat', keywords: ['wheat'] },
      { id: 'barley', name: 'Barley', keywords: ['barley'] },
      { id: 'rye', name: 'Rye', keywords: ['rye'] },
      { id: 'flour', name: 'Flour', keywords: ['flour'] },
      { id: 'noodles', name: 'Noodles', keywords: ['noodle'] },
      { id: 'bread', name: 'Bread', keywords: ['bread'] },
      { id: 'steamed_bun', name: 'Steamed Bun', keywords: ['steamed bun', '馒头'] },
      { id: 'biscuit', name: 'Biscuit/Cookie', keywords: ['biscuit', 'cookie'] },
      { id: 'gluten_seasoning', name: 'Gluten Seasoning', keywords: ['gluten seasoning'] },
    ],
  },
  {
    id: 'sesame',
    name: 'Sesame',
    icon: '🫘',
    riskLevel: 'high',
    subItems: [
      { id: 'white_sesame', name: 'White Sesame', keywords: ['white sesame'] },
      { id: 'black_sesame', name: 'Black Sesame', keywords: ['black sesame'] },
      { id: 'sesame_paste', name: 'Sesame Paste', keywords: ['sesame paste', 'tahini'] },
      { id: 'sesame_oil', name: 'Sesame Oil', keywords: ['sesame oil'] },
      { id: 'sesame_dessert', name: 'Sesame Dessert', keywords: ['sesame dessert'] },
      { id: 'sesame_snack', name: 'Sesame Snack', keywords: ['sesame snack'] },
    ],
  },
  {
    id: 'fruits',
    name: 'Fruits',
    icon: '🍎',
    riskLevel: 'low',
    subItems: [
      { id: 'mango', name: 'Mango', keywords: ['mango'] },
      { id: 'pineapple', name: 'Pineapple', keywords: ['pineapple'] },
      { id: 'kiwi', name: 'Kiwi', keywords: ['kiwi', 'kiwifruit'] },
      { id: 'strawberry', name: 'Strawberry', keywords: ['strawberry'] },
      { id: 'peach', name: 'Peach', keywords: ['peach'] },
      { id: 'plum', name: 'Plum', keywords: ['plum'] },
      { id: 'cherry', name: 'Cherry', keywords: ['cherry'] },
      { id: 'banana', name: 'Banana', keywords: ['banana'] },
      { id: 'apple', name: 'Apple', keywords: ['apple'] },
      { id: 'durian', name: 'Durian', keywords: ['durian'] },
    ],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    icon: '🥬',
    riskLevel: 'low',
    subItems: [
      { id: 'celery', name: 'Celery', keywords: ['celery'] },
      { id: 'coriander', name: 'Coriander', keywords: ['coriander', 'cilantro'] },
      { id: 'chives', name: 'Chives', keywords: ['chives', '韭菜'] },
      { id: 'spinach', name: 'Spinach', keywords: ['spinach'] },
      { id: 'tomato', name: 'Tomato', keywords: ['tomato'] },
      { id: 'potato', name: 'Potato', keywords: ['potato'] },
      { id: 'carrot', name: 'Carrot', keywords: ['carrot'] },
      { id: 'eggplant', name: 'Eggplant', keywords: ['eggplant'] },
      { id: 'shiitake', name: 'Shiitake Mushroom', keywords: ['shiitake', '香菇'] },
      { id: 'enoki', name: 'Enoki Mushroom', keywords: ['enoki', '金针菇'] },
    ],
  },
  {
    id: 'grains',
    name: 'Grains',
    icon: '🌽',
    riskLevel: 'low',
    subItems: [
      { id: 'corn', name: 'Corn', keywords: ['corn', 'maize'] },
      { id: 'millet', name: 'Millet', keywords: ['millet', '小米'] },
      { id: 'buckwheat', name: 'Buckwheat', keywords: ['buckwheat'] },
      { id: 'sorghum', name: 'Sorghum', keywords: ['sorghum'] },
      { id: 'jobstears', name: 'Job\'s Tears', keywords: ['job\'s tears', '薏米'] },
    ],
  },
  {
    id: 'meat',
    name: 'Meat',
    icon: '🥩',
    riskLevel: 'low',
    subItems: [
      { id: 'beef', name: 'Beef', keywords: ['beef'] },
      { id: 'lamb', name: 'Lamb', keywords: ['lamb', 'mutton'] },
      { id: 'pork', name: 'Pork', keywords: ['pork'] },
      { id: 'chicken', name: 'Chicken', keywords: ['chicken'] },
      { id: 'duck', name: 'Duck', keywords: ['duck'] },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '🍯',
    riskLevel: 'low',
    subItems: [
      { id: 'honey', name: 'Honey', keywords: ['honey'] },
      { id: 'mustard', name: 'Mustard', keywords: ['mustard'] },
      { id: 'sichuan_pepper', name: 'Sichuan Pepper', keywords: ['sichuan pepper', '花椒'] },
      { id: 'preservatives', name: 'Food Preservatives', keywords: ['preservative'] },
      { id: 'food_coloring', name: 'Food Coloring', keywords: ['coloring', 'colouring'] },
    ],
  },
];

export const HIGH_RISK_ALLERGENS = ALLERGEN_CATEGORIES.filter(c => c.riskLevel === 'high');
export const LOW_RISK_ALLERGENS = ALLERGEN_CATEGORIES.filter(c => c.riskLevel === 'low');

export function getAllergenCategory(id: AllergenCategory): AllergenCategoryData | undefined {
  return ALLERGEN_CATEGORIES.find(c => c.id === id);
}

export function getEmptyAllergenSelections(): Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }> {
  const selections = {} as Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>;
  
  ALLERGEN_CATEGORIES.forEach(category => {
    selections[category.id] = {
      categoryId: category.id,
      selectedSubItems: [],
      isAllSelected: false,
    };
  });
  
  return selections;
}

export function checkAllergenMatch(
  allergenSelections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>,
  productKeywords: string[]
): { matched: boolean; category?: AllergenCategoryData; subItem?: string } {
  for (const category of ALLERGEN_CATEGORIES) {
    const selection = allergenSelections[category.id];
    
    if (selection.isAllSelected || selection.selectedSubItems.length > 0) {
      if (selection.isAllSelected) {
        for (const keyword of productKeywords) {
          const lowerKeyword = keyword.toLowerCase();
          for (const subItem of category.subItems) {
            if (subItem.keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
              return { matched: true, category, subItem: subItem.name };
            }
          }
          for (const catKeyword of [category.name, ...category.subItems.map(s => s.name)]) {
            if (lowerKeyword.includes(catKeyword.toLowerCase())) {
              return { matched: true, category };
            }
          }
        }
      } else {
        for (const subItemId of selection.selectedSubItems) {
          const subItem = category.subItems.find(s => s.id === subItemId);
          if (subItem) {
            for (const keyword of productKeywords) {
              const lowerKeyword = keyword.toLowerCase();
              if (subItem.keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
                return { matched: true, category, subItem: subItem.name };
              }
            }
          }
        }
      }
    }
  }
  
  return { matched: false };
}
