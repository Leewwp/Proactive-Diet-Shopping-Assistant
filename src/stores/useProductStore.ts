import { Product, ScannedProduct } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { create } = require('zustand');
const { createJSONStorage, persist } = require('zustand/middleware');

interface ProductState {
  recentScans: ScannedProduct[];
  comparisonProducts: Product[];
  cachedProducts: Record<string, Product>;
  isLoading: boolean;
  error: string | null;

  addRecentScan: (product: Product) => void;
  clearRecentScans: () => void;
  addToComparison: (product: Product) => void;
  removeFromComparison: (barcode: string) => void;
  clearComparison: () => void;
  cacheProduct: (product: Product) => void;
  getCachedProduct: (barcode: string) => Product | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const MAX_RECENT_SCANS = 5;
const MAX_COMPARISON_PRODUCTS = 2;

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      recentScans: [],
      comparisonProducts: [],
      cachedProducts: {},
      isLoading: false,
      error: null,

      addRecentScan: (product) => {
        const scannedProduct: ScannedProduct = {
          ...product,
          scannedAt: new Date().toISOString(),
        };

        set((state) => {
          const filteredScans = state.recentScans.filter(
            (p) => p.barcode !== product.barcode
          );
          const newScans = [scannedProduct, ...filteredScans].slice(
            0,
            MAX_RECENT_SCANS
          );
          return { recentScans: newScans };
        });

        get().cacheProduct(product);
      },

      clearRecentScans: () => set({ recentScans: [] }),

      addToComparison: (product) => {
        const current = get().comparisonProducts;

        if (current.length >= MAX_COMPARISON_PRODUCTS) {
          set({
            comparisonProducts: [current[1], product],
          });
        } else if (!current.find((p) => p.barcode === product.barcode)) {
          set({
            comparisonProducts: [...current, product],
          });
        }
      },

      removeFromComparison: (barcode) => {
        set((state) => ({
          comparisonProducts: state.comparisonProducts.filter(
            (p) => p.barcode !== barcode
          ),
        }));
      },

      clearComparison: () => set({ comparisonProducts: [] }),

      cacheProduct: (product) => {
        set((state) => ({
          cachedProducts: {
            ...state.cachedProducts,
            [product.barcode]: product,
          },
        }));
      },

      getCachedProduct: (barcode) => {
        return get().cachedProducts[barcode];
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentScans: state.recentScans,
        cachedProducts: state.cachedProducts,
      }),
    }
  )
);
