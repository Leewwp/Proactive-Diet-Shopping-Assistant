import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalProduct, LocalProductImport, normalizeLocalProductImport, validateLocalProduct } from '@/types/localProduct';
import { Product } from '@/types';

const LOCAL_PRODUCTS_STORAGE_KEY = '@local_products';
const LOCAL_PRODUCTS_BARCODE_PREFIX = 'LOCAL_';

export function isLocalProductBarcode(barcode: string): boolean {
  return barcode.startsWith(LOCAL_PRODUCTS_BARCODE_PREFIX);
}

export function generateLocalBarcode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${LOCAL_PRODUCTS_BARCODE_PREFIX}${timestamp}_${random}`.toUpperCase();
}

export async function loadLocalProducts(): Promise<LocalProduct[]> {
  try {
    const data = await AsyncStorage.getItem(LOCAL_PRODUCTS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as LocalProduct[];
    }
    return [];
  } catch (error) {
    console.error('Failed to load local products:', error);
    return [];
  }
}

export async function saveLocalProducts(products: LocalProduct[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save local products:', error);
    throw error;
  }
}

export async function findLocalProductByBarcode(barcode: string): Promise<LocalProduct | null> {
  const products = await loadLocalProducts();
  return products.find(p => p.barcode === barcode) || null;
}

export async function addLocalProduct(product: LocalProduct): Promise<void> {
  const validation = validateLocalProduct(product);
  if (!validation.valid) {
    throw new Error(`Invalid product: ${validation.errors.join(', ')}`);
  }

  const products = await loadLocalProducts();
  const existingIndex = products.findIndex(p => p.barcode === product.barcode);
  
  if (existingIndex >= 0) {
    products[existingIndex] = {
      ...product,
      updatedAt: new Date().toISOString(),
    };
  } else {
    products.push({
      ...product,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  await saveLocalProducts(products);
}

export async function updateLocalProduct(barcode: string, updates: Partial<LocalProduct>): Promise<void> {
  const products = await loadLocalProducts();
  const index = products.findIndex(p => p.barcode === barcode);
  
  if (index < 0) {
    throw new Error(`Product with barcode ${barcode} not found`);
  }
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await saveLocalProducts(products);
}

export async function deleteLocalProduct(barcode: string): Promise<void> {
  const products = await loadLocalProducts();
  const filtered = products.filter(p => p.barcode !== barcode);
  await saveLocalProducts(filtered);
}

export async function importProductsFromJson(jsonString: string): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    const importData: LocalProductImport[] = JSON.parse(jsonString);
    
    if (!Array.isArray(importData)) {
      throw new Error('Import data must be an array');
    }

    const existingProducts = await loadLocalProducts();
    const existingBarcodes = new Set(existingProducts.map(p => p.barcode));

    for (const item of importData) {
      try {
        if (!item.barcode || !item.name) {
          errors.push(`Missing required fields: ${JSON.stringify(item)}`);
          failed++;
          continue;
        }

        const normalized = normalizeLocalProductImport(item);
        
        if (existingBarcodes.has(normalized.barcode)) {
          const index = existingProducts.findIndex(p => p.barcode === normalized.barcode);
          existingProducts[index] = {
            ...normalized,
            createdAt: existingProducts[index].createdAt,
            updatedAt: new Date().toISOString(),
          };
        } else {
          existingProducts.push(normalized);
          existingBarcodes.add(normalized.barcode);
        }
        
        success++;
      } catch (err) {
        errors.push(`Failed to import: ${JSON.stringify(item)} - ${err}`);
        failed++;
      }
    }

    await saveLocalProducts(existingProducts);
  } catch (error) {
    errors.push(`Parse error: ${error}`);
    failed++;
  }

  return { success, failed, errors };
}

export async function exportProductsToJson(): Promise<string> {
  const products = await loadLocalProducts();
  return JSON.stringify(products, null, 2);
}

export function convertLocalProductToProduct(localProduct: LocalProduct): Product {
  return {
    barcode: localProduct.barcode,
    name: localProduct.name,
    brand: localProduct.brand,
    imageUrl: localProduct.imageUrl,
    nutrition: localProduct.nutrition,
    allergens: localProduct.allergens,
    categories: localProduct.categories,
    nutriScore: localProduct.nutriScore,
    ingredients: localProduct.ingredients,
    servingSize: localProduct.servingSize,
    quantity: localProduct.quantity,
  };
}

export async function searchLocalProducts(query: string): Promise<LocalProduct[]> {
  const products = await loadLocalProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    (p.brand && p.brand.toLowerCase().includes(lowerQuery)) ||
    p.categories.some(c => c.toLowerCase().includes(lowerQuery))
  );
}
