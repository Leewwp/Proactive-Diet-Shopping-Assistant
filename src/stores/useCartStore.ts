import { AlertInfo, CartItem, CartNutritionSummary, Product } from '@/types';
import { calculateOverallComplianceScore, determineAlertLevel } from '@/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProfileStore } from './useProfileStore';

interface CartState {
  items: CartItem[];
  summary: CartNutritionSummary;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  assignToMember: (itemId: string, memberIds: string[]) => void;
  recalculateSummary: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const calculateSummary = (items: CartItem[]): CartNutritionSummary => {
  const profile = useProfileStore.getState().profile;
  const alerts: AlertInfo[] = [];

  const totals = items.reduce(
    (acc, item) => {
      const { nutrition } = item.product;
      const quantity = item.quantity;

      if (profile) {
        const alert = determineAlertLevel(item.product, profile);
        if (alert.level !== 'compliant') {
          alerts.push(alert);
        }
      }

      return {
        totalCalories: acc.totalCalories + nutrition.calories * quantity,
        totalSugar: acc.totalSugar + nutrition.sugar * quantity,
        totalSodium: acc.totalSodium + nutrition.sodium * quantity,
        totalFat: acc.totalFat + nutrition.fat * quantity,
        totalProtein: acc.totalProtein + nutrition.protein * quantity,
        totalFiber: acc.totalFiber + nutrition.fiber * quantity,
      };
    },
    {
      totalCalories: 0,
      totalSugar: 0,
      totalSodium: 0,
      totalFat: 0,
      totalProtein: 0,
      totalFiber: 0,
    }
  );

  const complianceScore = profile
    ? calculateOverallComplianceScore(
        items.map((i) => i.product),
        profile
      )
    : 100;

  return {
    ...totals,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    complianceScore,
    alerts,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      summary: {
        totalCalories: 0,
        totalSugar: 0,
        totalSodium: 0,
        totalFat: 0,
        totalProtein: 0,
        totalFiber: 0,
        itemCount: 0,
        complianceScore: 100,
        alerts: [],
      },

      addItem: (product, quantity = 1) => {
        const existingItem = get().items.find((item) => item.product.barcode === product.barcode);

        if (existingItem) {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          }));
        } else {
          const newItem: CartItem = {
            id: generateId(),
            product,
            quantity,
            addedAt: new Date().toISOString(),
          };
          set((state) => ({
            items: [...state.items, newItem],
          }));
        }

        get().recalculateSummary();
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        get().recalculateSummary();
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
        get().recalculateSummary();
      },

      clearCart: () => {
        set({
          items: [],
          summary: {
            totalCalories: 0,
            totalSugar: 0,
            totalSodium: 0,
            totalFat: 0,
            totalProtein: 0,
            totalFiber: 0,
            itemCount: 0,
            complianceScore: 100,
            alerts: [],
          },
        });
      },

      assignToMember: (itemId, memberIds) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, assignedTo: memberIds } : item
          ),
        }));
      },

      recalculateSummary: () => {
        const summary = calculateSummary(get().items);
        set({ summary });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
