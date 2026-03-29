import { LocalProduct } from '@/types/localProduct';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { create } = require('zustand');
const { createJSONStorage, persist } = require('zustand/middleware');

interface LocalProductState {
  products: LocalProduct[];
  isLoading: boolean;
  error: string | null;

  setProducts: (products: LocalProduct[]) => void;
  addProduct: (product: LocalProduct) => void;
  updateProduct: (barcode: string, updates: Partial<LocalProduct>) => void;
  deleteProduct: (barcode: string) => void;
  getProductByBarcode: (barcode: string) => LocalProduct | undefined;
  searchProducts: (query: string) => LocalProduct[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

function normalizeBarcodeForMatch(barcode: string): string[] {
  if (!barcode) return [];
  
  if (barcode.toUpperCase().startsWith('LOCAL_')) {
    return [barcode.toUpperCase(), barcode];
  }
  
  const cleanBarcode = barcode.replace(/[^0-9]/g, '');
  if (cleanBarcode.length === 0) {
    return [barcode];
  }
  
  const candidates = [cleanBarcode];
  if (cleanBarcode.length === 12) {
    candidates.push(`0${cleanBarcode}`);
  }
  if (cleanBarcode.length === 13 && cleanBarcode.startsWith('0')) {
    candidates.push(cleanBarcode.substring(1));
  }
  return candidates;
}

export const useLocalProductStore = create<LocalProductState>()(
  persist(
    (set: any, get: any) => ({
      products: [],
      isLoading: false,
      error: null,

      setProducts: (products: LocalProduct[]) => set({ products }),

      addProduct: (product: LocalProduct) => {
        set((state: LocalProductState) => {
          const existingIndex = state.products.findIndex((p: LocalProduct) => p.barcode === product.barcode);
          if (existingIndex >= 0) {
            const updated = [...state.products];
            updated[existingIndex] = {
              ...product,
              updatedAt: new Date().toISOString(),
            };
            return { products: updated };
          }
          return {
            products: [
              ...state.products,
              {
                ...product,
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      updateProduct: (barcode: string, updates: Partial<LocalProduct>) => {
        set((state: LocalProductState) => ({
          products: state.products.map((p: LocalProduct) =>
            p.barcode === barcode
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProduct: (barcode: string) => {
        set((state: LocalProductState) => ({
          products: state.products.filter((p: LocalProduct) => p.barcode !== barcode),
        }));
      },

      getProductByBarcode: (barcode: string) => {
        const products = get().products as LocalProduct[];
        if (!barcode) return undefined;
        
        const inputCandidates = normalizeBarcodeForMatch(barcode);
        
        for (const candidate of inputCandidates) {
          const found = products.find((p: LocalProduct) => {
            const productCandidates = normalizeBarcodeForMatch(p.barcode);
            return productCandidates.some(pc => pc === candidate);
          });
          if (found) return found;
        }
        
        return undefined;
      },

      searchProducts: (query: string) => {
        const products = get().products as LocalProduct[];
        const lowerQuery = query.toLowerCase();
        return products.filter((p: LocalProduct) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          (p.brand && p.brand.toLowerCase().includes(lowerQuery)) ||
          p.barcode.toLowerCase().includes(lowerQuery) ||
          p.categories.some((c: string) => c.toLowerCase().includes(lowerQuery))
        );
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'local-product-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: LocalProductState) => ({
        products: state.products,
      }),
    }
  )
);
