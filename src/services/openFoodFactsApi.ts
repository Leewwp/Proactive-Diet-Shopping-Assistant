import { NutritionInfo, Product } from '@/types';
import {
  getBarcodeCandidates,
  getBarcodeType,
  getPreferredOpenFoodFactsHosts,
  isBarcodeValid,
  normalizeBarcode,
  OpenFoodFactsHost,
} from './barcodeUtils';
import { fetchAliyunProductByBarcode } from './aliyunBarcodeApi';

const OPEN_FOOD_FACTS_API_BASE_URLS: Record<OpenFoodFactsHost, string> = {
  world: 'https://world.openfoodfacts.org/api/v2',
  cn: 'https://cn.openfoodfacts.org/api/v2',
};

const USER_AGENT = 'ProactiveDietShoppingAssistant/1.1 (Android; Region-Aware)';
const REQUEST_TIMEOUT_MS = 2600;
const SEARCH_TIMEOUT_MS = 3200;
const REQUEST_STAGGER_MS = 180;
const BARCODE_CACHE_TTL_MS = 10 * 60 * 1000;
const BARCODE_MISS_CACHE_TTL_MS = 45 * 1000;

interface Nutriments {
  'energy-kcal_100g'?: number;
  'energy-kcal'?: number;
  sugars_100g?: number;
  sugars?: number;
  fat_100g?: number;
  fat?: number;
  'saturated-fat_100g'?: number;
  'saturated-fat'?: number;
  sodium_100g?: number;
  sodium?: number;
  salt_100g?: number;
  salt?: number;
  proteins_100g?: number;
  proteins?: number;
  fiber_100g?: number;
  fiber?: number;
  carbohydrates_100g?: number;
  carbohydrates?: number;
  'added-sugars_100g'?: number;
  'added-sugars'?: number;
}

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  product_name_zh?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  nutriments?: Nutriments;
  allergens?: string;
  allergens_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  nutriscore_grade?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  serving_size?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

interface SearchResponse {
  products: OpenFoodFactsProduct[];
}

interface CacheEntry {
  value: Product | null;
  expiresAt: number;
}

const barcodeCache = new Map<string, CacheEntry>();
const inflightBarcodeRequests = new Map<string, Promise<Product | null>>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTag(tag: string): string {
  return tag
    .replace(/^[a-z]{2}:/i, '')
    .replace(/-/g, ' ')
    .trim()
    .toLowerCase();
}

function uniqueStringArray(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function parseNutriments(nutriments?: Nutriments): NutritionInfo {
  return {
    calories: nutriments?.['energy-kcal_100g'] || nutriments?.['energy-kcal'] || 0,
    sugar: nutriments?.sugars_100g || nutriments?.sugars || 0,
    fat: nutriments?.fat_100g || nutriments?.fat || 0,
    saturatedFat: nutriments?.['saturated-fat_100g'] || nutriments?.['saturated-fat'] || 0,
    sodium:
      nutriments?.sodium_100g ||
      nutriments?.sodium ||
      (nutriments?.salt_100g ? nutriments.salt_100g * 0.4 : 0),
    protein: nutriments?.proteins_100g || nutriments?.proteins || 0,
    fiber: nutriments?.fiber_100g || nutriments?.fiber || 0,
    carbohydrates: nutriments?.carbohydrates_100g || nutriments?.carbohydrates || 0,
    addedSugar: nutriments?.['added-sugars_100g'] || nutriments?.['added-sugars'],
  };
}

function parseAllergens(product: OpenFoodFactsProduct): string[] {
  const allergens: string[] = [];

  if (product.allergens_tags) {
    allergens.push(...product.allergens_tags.map(parseTag));
  }

  if (product.allergens) {
    allergens.push(
      ...product.allergens
        .split(',')
        .map((allergen) => parseTag(allergen))
        .filter((allergen) => allergen.length > 0)
    );
  }

  return uniqueStringArray(allergens);
}

function parseCategories(product: OpenFoodFactsProduct): string[] {
  const categories: string[] = [];

  if (product.categories_tags) {
    categories.push(...product.categories_tags.map(parseTag));
  }

  if (product.categories) {
    categories.push(
      ...product.categories
        .split(',')
        .map((category) => parseTag(category))
        .filter((category) => category.length > 0)
    );
  }

  return uniqueStringArray(categories);
}

function mapOpenFoodFactsProduct(product: OpenFoodFactsProduct): Product {
  return {
    barcode: product.code,
    name: product.product_name_zh || product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands,
    imageUrl: product.image_front_url || product.image_url,
    nutrition: parseNutriments(product.nutriments),
    allergens: parseAllergens(product),
    categories: parseCategories(product),
    nutriScore: product.nutriscore_grade?.toUpperCase() as Product['nutriScore'],
    ingredients: uniqueStringArray(
      (product.ingredients_text || product.ingredients_text_en || '')
        .split(',')
        .map((ingredient) => ingredient.trim())
    ),
    servingSize: product.serving_size,
    quantity: product.quantity,
  };
}

function mapOpenFoodFactsResponse(response: OpenFoodFactsResponse): Product | null {
  if (response.status !== 1 || !response.product) {
    return null;
  }

  return mapOpenFoodFactsProduct(response.product);
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (__DEV__) {
      console.warn('Network request failed:', url, error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function firstSuccessfulProduct(tasks: (() => Promise<Product | null>)[]): Promise<Product | null> {
  if (tasks.length === 0) {
    return null;
  }

  return new Promise((resolve) => {
    let pendingCount = tasks.length;
    let hasResolved = false;

    const finishIfNeeded = () => {
      pendingCount -= 1;
      if (!hasResolved && pendingCount === 0) {
        resolve(null);
      }
    };

    tasks.forEach((task) => {
      task()
        .then((product) => {
          if (!hasResolved && product) {
            hasResolved = true;
            resolve(product);
          }
        })
        .catch(() => undefined)
        .finally(finishIfNeeded);
    });
  });
}

async function fetchDirectProduct(host: OpenFoodFactsHost, barcode: string): Promise<Product | null> {
  const endpoint = `${OPEN_FOOD_FACTS_API_BASE_URLS[host]}/product/${barcode}.json`;
  const data = await fetchJsonWithTimeout<OpenFoodFactsResponse>(endpoint, REQUEST_TIMEOUT_MS);
  if (!data) {
    return null;
  }
  return mapOpenFoodFactsResponse(data);
}

async function searchProductByBarcodeOnHost(host: OpenFoodFactsHost, barcode: string): Promise<Product | null> {
  const endpoint =
    `${OPEN_FOOD_FACTS_API_BASE_URLS[host]}/search?code=${encodeURIComponent(barcode)}` +
    '&page_size=5&json=true';
  const data = await fetchJsonWithTimeout<SearchResponse>(endpoint, SEARCH_TIMEOUT_MS);

  if (!data?.products || data.products.length === 0) {
    return null;
  }

  const candidate = data.products.find((product) => product.code === barcode) || data.products[0];
  return candidate ? mapOpenFoodFactsProduct(candidate) : null;
}

async function lookupBarcodeAgainstHosts(
  barcode: string,
  hosts: OpenFoodFactsHost[],
  lookup: (host: OpenFoodFactsHost, barcode: string) => Promise<Product | null>
): Promise<Product | null> {
  const tasks = hosts.map((host, index) => async () => {
    if (index > 0) {
      await delay(index * REQUEST_STAGGER_MS);
    }
    return lookup(host, barcode);
  });

  return firstSuccessfulProduct(tasks);
}

async function fetchFromOpenFoodFacts(barcodeCandidates: string[], hosts: OpenFoodFactsHost[]): Promise<Product | null> {
  for (const candidate of barcodeCandidates) {
    const directResult = await lookupBarcodeAgainstHosts(candidate, hosts, fetchDirectProduct);
    if (directResult) {
      return directResult;
    }
  }

  return null;
}

async function fetchFromOpenFoodFactsSearch(
  barcodeCandidates: string[],
  hosts: OpenFoodFactsHost[]
): Promise<Product | null> {
  for (const candidate of barcodeCandidates) {
    const searchResult = await lookupBarcodeAgainstHosts(candidate, hosts, searchProductByBarcodeOnHost);
    if (searchResult) {
      return searchResult;
    }
  }

  return null;
}

function getCachedBarcodeValue(barcode: string): Product | null | undefined {
  const now = Date.now();
  const cacheEntry = barcodeCache.get(barcode);
  if (!cacheEntry) {
    return undefined;
  }

  if (cacheEntry.expiresAt <= now) {
    barcodeCache.delete(barcode);
    return undefined;
  }

  return cacheEntry.value;
}

function setCachedBarcodeValue(barcodes: string[], product: Product | null): void {
  const ttl = product ? BARCODE_CACHE_TTL_MS : BARCODE_MISS_CACHE_TTL_MS;
  const cacheEntry: CacheEntry = {
    value: product,
    expiresAt: Date.now() + ttl,
  };

  for (const barcode of barcodes) {
    barcodeCache.set(barcode, cacheEntry);
  }
}

async function fetchProductByBarcodeInternal(rawBarcode: string): Promise<Product | null> {
  const normalized = normalizeBarcode(rawBarcode);
  const barcodeCandidates = getBarcodeCandidates(normalized);
  const hosts = getPreferredOpenFoodFactsHosts(normalized);

  const directResult = await fetchFromOpenFoodFacts(barcodeCandidates, hosts);
  if (directResult) {
    return directResult;
  }

  const fallbackTasks: (() => Promise<Product | null>)[] = [
    () => fetchFromOpenFoodFactsSearch(barcodeCandidates, hosts),
    () => fetchAliyunProductByBarcode(normalized, SEARCH_TIMEOUT_MS),
  ];

  return firstSuccessfulProduct(fallbackTasks);
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  const normalizedBarcode = normalizeBarcode(barcode);

  if (!isBarcodeValid(normalizedBarcode)) {
    return null;
  }

  const barcodeCandidates = getBarcodeCandidates(normalizedBarcode);
  for (const candidate of barcodeCandidates) {
    const cached = getCachedBarcodeValue(candidate);
    if (cached !== undefined) {
      return cached;
    }
  }

  const cacheKey = barcodeCandidates[0];
  const inflightRequest = inflightBarcodeRequests.get(cacheKey);
  if (inflightRequest) {
    return inflightRequest;
  }

  const request = fetchProductByBarcodeInternal(normalizedBarcode)
    .then((product) => {
      setCachedBarcodeValue(barcodeCandidates, product);
      return product;
    })
    .finally(() => {
      inflightBarcodeRequests.delete(cacheKey);
    });

  inflightBarcodeRequests.set(cacheKey, request);
  return request;
}

async function searchProductsOnHost(
  host: OpenFoodFactsHost,
  query: string,
  category?: string
): Promise<Product[]> {
  let endpoint =
    `${OPEN_FOOD_FACTS_API_BASE_URLS[host]}/search?search_terms=${encodeURIComponent(query)}` +
    '&page_size=20&json=true';

  if (category) {
    endpoint += `&categories_tags=${encodeURIComponent(category)}`;
  }

  const data = await fetchJsonWithTimeout<SearchResponse>(endpoint, SEARCH_TIMEOUT_MS);
  if (!data?.products) {
    return [];
  }

  return data.products
    .filter((product): product is OpenFoodFactsProduct => !!product && typeof product.code === 'string')
    .map(mapOpenFoodFactsProduct);
}

export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  if (!query.trim()) {
    return [];
  }

  const hosts: OpenFoodFactsHost[] = ['world', 'cn'];
  const productGroups = await Promise.all(hosts.map((host) => searchProductsOnHost(host, query, category)));
  const mergedProducts = productGroups.flat();

  const deduplicated = mergedProducts.filter(
    (product, index, self) => index === self.findIndex((item) => item.barcode === product.barcode)
  );

  return deduplicated.slice(0, 20);
}

async function findAlternativesOnHost(
  host: OpenFoodFactsHost,
  product: Product,
  maxSugar?: number
): Promise<Product[]> {
  const categories = product.categories.slice(0, 2).join(',');
  if (!categories) {
    return [];
  }

  let endpoint =
    `${OPEN_FOOD_FACTS_API_BASE_URLS[host]}/search?categories_tags=${encodeURIComponent(categories)}` +
    '&page_size=12&json=true';

  if (maxSugar !== undefined) {
    endpoint += `&nutriment_sugars_100g=${maxSugar}&nutriment_compare=sugars_100g`;
  }

  const data = await fetchJsonWithTimeout<SearchResponse>(endpoint, SEARCH_TIMEOUT_MS);
  if (!data?.products) {
    return [];
  }

  return data.products
    .filter(
      (candidate): candidate is OpenFoodFactsProduct =>
        !!candidate && typeof candidate.code === 'string' && candidate.code !== product.barcode
    )
    .map(mapOpenFoodFactsProduct);
}

export async function findAlternatives(
  product: Product,
  maxSugar?: number,
  maxSodium?: number,
  minProtein?: number
): Promise<Product[]> {
  const hosts = getPreferredOpenFoodFactsHosts(product.barcode);
  const alternativesByHost = await Promise.all(
    hosts.map((host) => findAlternativesOnHost(host, product, maxSugar))
  );

  const uniqueAlternatives = alternativesByHost
    .flat()
    .filter((candidate) => {
      if (maxSodium !== undefined && candidate.nutrition.sodium > maxSodium) {
        return false;
      }
      if (minProtein !== undefined && candidate.nutrition.protein < minProtein) {
        return false;
      }
      return true;
    })
    .filter(
      (candidate, index, self) => index === self.findIndex((item) => item.barcode === candidate.barcode)
    );

  return uniqueAlternatives.slice(0, 5);
}

export async function searchByProductName(productName: string): Promise<Product[]> {
  return searchProducts(productName);
}

export { getBarcodeType, isBarcodeValid };
