import { FamilyMember, Product } from '@/types';
import { checkFamilyConflicts } from '@/utils/complianceChecker';

export interface FamilyConflict {
  memberId: string;
  memberName: string;
  conflictType: 'allergen' | 'goal';
  details: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ConflictResolution {
  canAdd: boolean;
  conflicts: FamilyConflict[];
  suggestions: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
}

export function resolveFamilyConflicts(
  product: Product,
  familyMembers: FamilyMember[]
): ConflictResolution {
  const conflicts: FamilyConflict[] = [];
  const suggestions: string[] = [];
  const recommendedFor: string[] = [];
  const notRecommendedFor: string[] = [];

  const familyConflicts = checkFamilyConflicts(product, familyMembers);

  familyConflicts.forEach(({ member, alert }) => {
    const conflict: FamilyConflict = {
      memberId: member.id,
      memberName: member.name,
      conflictType: alert.level === 'emergency' ? 'allergen' : 'goal',
      details: alert.message,
      severity: alert.level === 'emergency' ? 'high' : alert.level === 'suggestion' ? 'medium' : 'low',
    };

    conflicts.push(conflict);
    notRecommendedFor.push(member.id);
  });

  familyMembers.forEach((member) => {
    const hasConflict = conflicts.some((c) => c.memberId === member.id);
    if (!hasConflict) {
      recommendedFor.push(member.id);
    }
  });

  if (conflicts.length > 0) {
    const highSeverityConflicts = conflicts.filter((c) => c.severity === 'high');

    if (highSeverityConflicts.length > 0) {
      suggestions.push(
        `This product contains allergens for ${highSeverityConflicts
          .map((c) => c.memberName)
          .join(', ')}. Consider an alternative.`
      );
    }

    const mediumSeverityConflicts = conflicts.filter((c) => c.severity === 'medium');
    if (mediumSeverityConflicts.length > 0) {
      suggestions.push(
        `This product may conflict with dietary goals of ${mediumSeverityConflicts
          .map((c) => c.memberName)
          .join(', ')}.`
      );
    }
  }

  const canAdd = !conflicts.some((c) => c.severity === 'high');

  return {
    canAdd,
    conflicts,
    suggestions,
    recommendedFor,
    notRecommendedFor,
  };
}

export function suggestFamilyAllocation(
  product: Product,
  familyMembers: FamilyMember[]
): { memberId: string; suitability: 'high' | 'medium' | 'low' }[] {
  const resolution = resolveFamilyConflicts(product, familyMembers);

  return familyMembers.map((member) => {
    const hasConflict = resolution.conflicts.some((c) => c.memberId === member.id);
    const isRecommended = resolution.recommendedFor.includes(member.id);

    let suitability: 'high' | 'medium' | 'low' = 'medium';

    if (isRecommended) {
      suitability = 'high';
    } else if (hasConflict) {
      const conflict = resolution.conflicts.find((c) => c.memberId === member.id);
      suitability = conflict?.severity === 'high' ? 'low' : 'medium';
    }

    return {
      memberId: member.id,
      suitability,
    };
  });
}
