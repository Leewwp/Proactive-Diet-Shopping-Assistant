import { COLORS, DARK_COLORS, DIET_GOAL_DESCRIPTIONS, DIET_GOAL_LABELS } from '@/constants';
import { DietGoal } from '@/types';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface GoalSelectorProps {
  selectedGoals: DietGoal[];
  onGoalToggle: (goal: DietGoal) => void;
  maxSelections?: number;
}

const AVAILABLE_GOALS: DietGoal[] = [
  'fat_loss',
  'muscle_gain',
  'sugar_control',
  'low_sodium',
  'vegetarian',
  'custom',
];

export function GoalSelector({ selectedGoals, onGoalToggle, maxSelections }: GoalSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const isSelected = (goal: DietGoal) => selectedGoals.includes(goal);
  const canSelect = !maxSelections || selectedGoals.length < maxSelections;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        What is your goal?
      </Text>
      <Text variant="bodySmall" style={[styles.subtitle, { color: colors.ui.textSecondary }]}>
        Select all that apply
      </Text>

      <View style={styles.chipsContainer}>
        {AVAILABLE_GOALS.map((goal) => {
          const selected = isSelected(goal);
          const disabled = !selected && !canSelect;

          return (
            <Chip
              key={goal}
              mode={selected ? 'flat' : 'outlined'}
              selected={selected}
              onPress={() => !disabled && onGoalToggle(goal)}
              style={[
                styles.chip,
                selected && { backgroundColor: colors.ui.primary },
                disabled && styles.disabledChip,
              ]}
              textStyle={{
                color: selected ? '#FFFFFF' : disabled ? colors.ui.textSecondary : colors.ui.text,
              }}
            >
              {DIET_GOAL_LABELS[goal]}
            </Chip>
          );
        })}
      </View>

      {selectedGoals.length > 0 && (
        <View style={styles.descriptions}>
          {selectedGoals.map((goal) => (
            <Text
              key={goal}
              variant="bodySmall"
              style={[styles.description, { color: colors.ui.textSecondary }]}
            >
              - {DIET_GOAL_LABELS[goal]}: {DIET_GOAL_DESCRIPTIONS[goal]()}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  disabledChip: {
    opacity: 0.5,
  },
  descriptions: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  description: {
    marginVertical: 2,
  },
});
