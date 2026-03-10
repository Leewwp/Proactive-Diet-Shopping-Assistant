import { calculateDailyNutritionTargets } from '@/services/nutritionCalculator';
import { BodyData, DietGoal, FamilyMember, UserProfile, AllergenCategory } from '@/types';
import { getEmptyAllergenSelections } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ProfileState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  abTestMode: 'A' | 'B' | 'C';
  devMenuTapCount: number;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addFamilyMember: (member: FamilyMember) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  setGoals: (goals: DietGoal[]) => void;
  setAllergenSelections: (selections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>) => void;
  setBodyData: (bodyData: BodyData) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
  setAbTestMode: (mode: 'A' | 'B' | 'C') => void;
  incrementDevMenuTap: () => boolean;
  resetDevMenuTap: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,
      abTestMode: 'B',
      devMenuTapCount: 0,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          
          const updatedProfile: UserProfile = {
            ...state.profile,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          if (updates.bodyData || updates.goals) {
            updatedProfile.dailyTargets = calculateDailyNutritionTargets(
              updatedProfile.bodyData,
              updatedProfile.goals
            );
          }
          
          return { profile: updatedProfile };
        }),

      addFamilyMember: (member) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          return {
            profile: {
              ...state.profile,
              familyMembers: [...state.profile.familyMembers, member],
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateFamilyMember: (id, updates) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          
          const updatedMembers = state.profile.familyMembers.map((m) => {
            if (m.id === id) {
              const updatedMember = { ...m, ...updates };
              if (updates.bodyData || updates.goals) {
                updatedMember.dailyTargets = calculateDailyNutritionTargets(
                  updatedMember.bodyData,
                  updatedMember.goals
                );
              }
              return updatedMember;
            }
            return m;
          });

          return {
            profile: {
              ...state.profile,
              familyMembers: updatedMembers,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      removeFamilyMember: (id) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          return {
            profile: {
              ...state.profile,
              familyMembers: state.profile.familyMembers.filter((m) => m.id !== id),
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setGoals: (goals) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          return {
            profile: {
              ...state.profile,
              goals,
              dailyTargets: calculateDailyNutritionTargets(state.profile.bodyData, goals),
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setAllergenSelections: (selections) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          return {
            profile: {
              ...state.profile,
              allergenSelections: selections,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      setBodyData: (bodyData) =>
        set((state) => {
          if (!state.profile) return { profile: null };
          return {
            profile: {
              ...state.profile,
              bodyData,
              dailyTargets: calculateDailyNutritionTargets(bodyData, state.profile.goals),
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      completeOnboarding: () => set({ isOnboarded: true }),

      resetProfile: () =>
        set({
          profile: null,
          isOnboarded: false,
          devMenuTapCount: 0,
        }),

      setAbTestMode: (mode) => set({ abTestMode: mode }),

      incrementDevMenuTap: () => {
        const newCount = get().devMenuTapCount + 1;
        set({ devMenuTapCount: newCount });
        return newCount >= 5;
      },

      resetDevMenuTap: () => set({ devMenuTapCount: 0 }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const createDefaultProfile = (name: string = 'User', bodyData?: BodyData): UserProfile => {
  const goals: DietGoal[] = [];
  return {
    id: generateId(),
    name,
    avatar: undefined,
    goals,
    allergenSelections: getEmptyAllergenSelections(),
    restrictions: [],
    familyMembers: [],
    bodyData,
    dailyTargets: calculateDailyNutritionTargets(bodyData, goals),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const createFamilyMember = (name: string, bodyData?: BodyData): FamilyMember => {
  const goals: DietGoal[] = [];
  return {
    id: generateId(),
    name,
    goals,
    allergenSelections: getEmptyAllergenSelections(),
    bodyData,
    dailyTargets: calculateDailyNutritionTargets(bodyData, goals),
  };
};
