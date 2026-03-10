import { NutritionInfo, Product } from '@/types';

type JsonRecord = Record<string, unknown>;

const ALIYUN_ENDPOINT = process.env.EXPO_PUBLIC_ALIYUN_BARCODE_ENDPOINT?.trim();
const ALIYUN_APPCODE = process.env.EXPO_PUBLIC_ALIYUN_BARCODE_APPCODE?.trim();
const ALIYUN_QUERY_PARAM = process.env.EXPO_PUBLIC_ALIYUN_BARCODE_PARAM?.trim() || 'code';
const DEFAULT_TIMEOUT_MS = 2800;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNumeric(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsedValue = Number(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }
  return undefined;
}

function readFirstString(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function readFirstArray(record: JsonRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
  return [];
}

function readFirstNumber(record: JsonRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const parsedValue = parseNumeric(record[key]);
    if (parsedValue !== undefined) {
      return parsedValue;
    }
  }
  return undefined;
}

function buildNutritionFromAliyun(productNode: JsonRecord): NutritionInfo {
  const nutritionNode = ['nutrition', 'nutritionFacts', 'nutriments', 'nutrient'].find(
    (key) => isRecord(productNode[key])
  );

  const scopedNode = nutritionNode ? (productNode[nutritionNode] as JsonRecord) : productNode;
  const sodiumValue =
    readFirstNumber(scopedNode, ['sodium_100g', 'sodium', 'na']) ??
    (() => {
      const saltValue = readFirstNumber(scopedNode, ['salt_100g', 'salt']);
      return saltValue !== undefined ? saltValue * 0.4 : undefined;
    })();

  return {
    calories: readFirstNumber(scopedNode, ['energy-kcal_100g', 'energy-kcal', 'calories', 'energy']) ?? 0,
    sugar: readFirstNumber(scopedNode, ['sugars_100g', 'sugars', 'sugar']) ?? 0,
    fat: readFirstNumber(scopedNode, ['fat_100g', 'fat']) ?? 0,
    saturatedFat: readFirstNumber(scopedNode, ['saturated-fat_100g', 'saturated-fat', 'saturatedFat']) ?? 0,
    sodium: sodiumValue ?? 0,
    protein: readFirstNumber(scopedNode, ['proteins_100g', 'proteins', 'protein']) ?? 0,
    fiber: readFirstNumber(scopedNode, ['fiber_100g', 'fiber']) ?? 0,
    carbohydrates: readFirstNumber(scopedNode, ['carbohydrates_100g', 'carbohydrates', 'carbohydrate']) ?? 0,
    addedSugar: readFirstNumber(scopedNode, ['added-sugars_100g', 'added-sugars', 'addedSugar']),
  };
}

function createAliyunUrl(barcode: string): string | null {
  if (!ALIYUN_ENDPOINT) {
    return null;
  }

  if (ALIYUN_ENDPOINT.includes('{barcode}')) {
    return ALIYUN_ENDPOINT.replace(/\{barcode\}/g, encodeURIComponent(barcode));
  }

  const hasQuery = ALIYUN_ENDPOINT.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${ALIYUN_ENDPOINT}${separator}${encodeURIComponent(ALIYUN_QUERY_PARAM)}=${encodeURIComponent(barcode)}`;
}

function getNestedRecord(root: JsonRecord, path: string[]): JsonRecord | null {
  let current: unknown = root;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[key];
  }

  return isRecord(current) ? current : null;
}

function collectCandidateNodes(payload: JsonRecord): JsonRecord[] {
  const candidates: JsonRecord[] = [];
  const pushIfRecord = (value: unknown) => {
    if (isRecord(value)) {
      candidates.push(value);
    }
  };

  pushIfRecord(payload);
  pushIfRecord(payload.result);
  pushIfRecord(payload.data);
  pushIfRecord(payload.retData);
  pushIfRecord(payload.content);
  pushIfRecord(payload.goods);
  pushIfRecord(payload.item);
  pushIfRecord(getNestedRecord(payload, ['showapi_res_body']));
  pushIfRecord(getNestedRecord(payload, ['showapi_res_body', 'result']));
  pushIfRecord(getNestedRecord(payload, ['showapi_res_body', 'data']));
  pushIfRecord(getNestedRecord(payload, ['data', 'result']));
  pushIfRecord(getNestedRecord(payload, ['result', 'data']));

  const nestedProductKeys = ['product', 'productInfo', 'goodsInfo', 'itemInfo', 'barcodeInfo'];
  for (const node of [...candidates]) {
    for (const key of nestedProductKeys) {
      pushIfRecord(node[key]);
    }
  }

  return candidates;
}

function pickBestAliyunNode(payload: JsonRecord): JsonRecord | null {
  const candidates = collectCandidateNodes(payload);

  for (const candidate of candidates) {
    const hasProductName = !!readFirstString(candidate, [
      'name',
      'product_name',
      'productName',
      'goods_name',
      'title',
    ]);
    const hasBarcode = !!readFirstString(candidate, ['code', 'barcode', 'barCode']);
    const hasNutrition =
      isRecord(candidate.nutrition) ||
      isRecord(candidate.nutritionFacts) ||
      isRecord(candidate.nutriments);

    if (hasProductName || hasBarcode || hasNutrition) {
      return candidate;
    }
  }

  return null;
}

function mapAliyunNodeToProduct(node: JsonRecord, barcode: string): Product {
  const productName =
    readFirstString(node, ['name', 'product_name', 'productName', 'goods_name', 'title']) ||
    'Unknown Product';
  const brand = readFirstString(node, ['brand', 'brand_name', 'brandName', 'producer', 'manufacturer']);
  const imageUrl = readFirstString(node, ['image', 'imageUrl', 'img', 'pic', 'picture']);
  const categories = readFirstArray(node, ['categories', 'category', 'categoryName']);
  const allergens = readFirstArray(node, ['allergens', 'allergen', 'allergenInfo']);
  const ingredients = readFirstArray(node, ['ingredients', 'ingredient', 'ingredients_text']);

  return {
    barcode: readFirstString(node, ['code', 'barcode', 'barCode']) || barcode,
    name: productName,
    brand,
    imageUrl,
    nutrition: buildNutritionFromAliyun(node),
    allergens,
    categories,
    ingredients,
    servingSize: readFirstString(node, ['serving_size', 'servingSize']),
    quantity: readFirstString(node, ['quantity', 'spec', 'size']),
  };
}

export function isAliyunBarcodeConfigured(): boolean {
  return Boolean(ALIYUN_ENDPOINT && ALIYUN_APPCODE);
}

export async function fetchAliyunProductByBarcode(
  barcode: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Product | null> {
  if (!isAliyunBarcodeConfigured()) {
    return null;
  }

  const requestUrl = createAliyunUrl(barcode);
  if (!requestUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `APPCODE ${ALIYUN_APPCODE}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      return null;
    }

    const productNode = pickBestAliyunNode(payload);
    if (!productNode) {
      return null;
    }

    return mapAliyunNodeToProduct(productNode, barcode);
  } catch (error) {
    if (__DEV__) {
      console.warn('Aliyun barcode fallback failed:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
