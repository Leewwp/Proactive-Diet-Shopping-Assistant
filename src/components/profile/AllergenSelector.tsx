import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Text as RNText,
  TouchableOpacity,
} from 'react-native';
import { Card, Switch, Checkbox, IconButton, Text } from 'react-native-paper';
import { COLORS, DARK_COLORS, HIGH_RISK_ALLERGENS, LOW_RISK_ALLERGENS } from '@/constants';
import { AllergenCategory, AllergenCategoryData } from '@/types';

interface AllergenSelectorProps {
  selections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>;
  onSelectionsChange: (selections: Record<AllergenCategory, { categoryId: AllergenCategory; selectedSubItems: string[]; isAllSelected: boolean }>) => void;
}

export function AllergenSelector({ selections, onSelectionsChange }: AllergenSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const [expandedCategories, setExpandedCategories] = useState<Set<AllergenCategory>>(new Set());

  const toggleCategoryExpand = (categoryId: AllergenCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleCategorySwitch = (category: AllergenCategoryData) => {
    const newSelections = { ...selections };
    const currentSelection = selections[category.id];
    
    if (currentSelection.isAllSelected) {
      newSelections[category.id] = {
        categoryId: category.id,
        selectedSubItems: [],
        isAllSelected: false,
      };
      const newExpanded = new Set(expandedCategories);
      newExpanded.delete(category.id);
      setExpandedCategories(newExpanded);
    } else {
      const allSubItemIds = category.subItems.map(s => s.id);
      newSelections[category.id] = {
        categoryId: category.id,
        selectedSubItems: allSubItemIds,
        isAllSelected: true,
      };
      setExpandedCategories(prev => new Set([...prev, category.id]));
    }
    
    onSelectionsChange(newSelections);
  };

  const toggleSubItem = (categoryId: AllergenCategory, subItemId: string, category: AllergenCategoryData) => {
    const newSelections = { ...selections };
    const currentSelection = selections[categoryId];
    
    let newSelectedSubItems: string[];
    if (currentSelection.selectedSubItems.includes(subItemId)) {
      newSelectedSubItems = currentSelection.selectedSubItems.filter(id => id !== subItemId);
    } else {
      newSelectedSubItems = [...currentSelection.selectedSubItems, subItemId];
    }
    
    const isAllSelected = newSelectedSubItems.length === category.subItems.length;
    
    newSelections[categoryId] = {
      categoryId,
      selectedSubItems: newSelectedSubItems,
      isAllSelected,
    };
    
    onSelectionsChange(newSelections);
  };

  const renderCategory = (category: AllergenCategoryData) => {
    const selection = selections[category.id];
    const isExpanded = expandedCategories.has(category.id);
    const isHighRisk = category.riskLevel === 'high';
    const isActive = selection.isAllSelected || selection.selectedSubItems.length > 0;

    return (
      <Card
        key={category.id}
        style={[
          styles.categoryCard,
          isHighRisk && styles.highRiskCard,
          { borderColor: isHighRisk ? colors.compliance.emergency : colors.ui.border },
        ]}
      >
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategoryExpand(category.id)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryHeaderLeft}>
            <RNText style={styles.categoryIcon}>{category.icon}</RNText>
            <View style={styles.categoryTitleContainer}>
              <Text variant="titleMedium" style={[
                styles.categoryTitle,
                { color: isHighRisk ? colors.compliance.emergency : colors.ui.text }
              ]}>
                {category.name}
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: isHighRisk ? '#FFEBEE' : '#F5F5F5' }]}>
                <RNText style={[styles.riskBadgeText, { color: isHighRisk ? '#D32F2F' : '#666' }]}>
                  {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
                </RNText>
              </View>
            </View>
          </View>
          <View style={styles.categoryHeaderRight}>
            <Switch
              value={isActive}
              onValueChange={() => toggleCategorySwitch(category)}
              color={isHighRisk ? colors.compliance.emergency : colors.ui.primary}
            />
            <IconButton
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              onPress={() => toggleCategoryExpand(category.id)}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.subItemsContainer}>
            <Text variant="labelSmall" style={styles.subItemsHint}>
              {selection.isAllSelected 
                ? 'All items selected (tap to deselect individual items)'
                : `${selection.selectedSubItems.length} of ${category.subItems.length} selected`}
            </Text>
            <View style={styles.subItemsGrid}>
              {category.subItems.map((subItem) => (
                <TouchableOpacity
                  key={subItem.id}
                  style={[
                    styles.subItemChip,
                    selection.selectedSubItems.includes(subItem.id) && styles.subItemChipActive,
                  ]}
                  onPress={() => toggleSubItem(category.id, subItem.id, category)}
                >
                  <Checkbox
                    status={selection.selectedSubItems.includes(subItem.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleSubItem(category.id, subItem.id, category)}
                  />
                  <Text variant="bodySmall" style={styles.subItemText}>
                    {subItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          HIGH RISK ALLERGENS
        </Text>
        <Text variant="bodySmall" style={[styles.sectionHint, { color: colors.compliance.emergency }]}>
          These can cause severe allergic reactions including anaphylaxis
        </Text>
        <View style={styles.categoriesContainer}>
          {HIGH_RISK_ALLERGENS.map(renderCategory)}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          LOW RISK ALLERGENS
        </Text>
        <Text variant="bodySmall" style={[styles.sectionHint, { color: colors.ui.textSecondary }]}>
          These typically cause milder reactions
        </Text>
        <View style={styles.categoriesContainer}>
          {LOW_RISK_ALLERGENS.map(renderCategory)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionHint: {
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryCard: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  highRiskCard: {
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subItemsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  subItemsHint: {
    marginBottom: 12,
    color: '#666',
  },
  subItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  subItemChipActive: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  subItemText: {
    marginLeft: 4,
  },
});
