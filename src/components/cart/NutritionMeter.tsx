import { COLORS, DARK_COLORS } from '@/constants';
import { CartNutritionSummary } from '@/types';
import { DAILY_VALUES } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { NutritionBar } from '../common';

interface NutritionMeterProps {
  summary: CartNutritionSummary;
  compact?: boolean;
}

export function NutritionMeter({ summary, compact = false }: NutritionMeterProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const { complianceScore } = summary;

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.compliance.compliant;
    if (score >= 50) return colors.compliance.suggestion;
    return colors.compliance.emergency;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.scoreCircle}>
          <Text variant="titleLarge" style={{ color: getScoreColor(complianceScore), fontWeight: '700' }}>
            {complianceScore}
          </Text>
        </View>
        <View style={styles.compactBars}>
          <NutritionBar
            label="Cal"
            value={summary.totalCalories}
            max={DAILY_VALUES.calories}
            showPercentage={false}
          />
          <NutritionBar
            label="Sugar"
            value={summary.totalSugar}
            max={DAILY_VALUES.sugar}
            unit="g"
            showPercentage={false}
          />
        </View>
      </View>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">Nutrition Balance</Text>
          <View style={[styles.scoreBadge, { backgroundColor: `${getScoreColor(complianceScore)}20` }]}>
            <Text variant="labelLarge" style={{ color: getScoreColor(complianceScore), fontWeight: '700' }}>
              {complianceScore}% Compliant
            </Text>
          </View>
        </View>

        <View style={styles.bars}>
          <NutritionBar
            label="Calories"
            value={summary.totalCalories}
            max={DAILY_VALUES.calories}
            dailyValue={DAILY_VALUES.calories}
          />
          <NutritionBar
            label="Sugar"
            value={summary.totalSugar}
            max={DAILY_VALUES.sugar}
            unit="g"
            dailyValue={DAILY_VALUES.sugar}
          />
          <NutritionBar
            label="Sodium"
            value={summary.totalSodium}
            max={DAILY_VALUES.sodium}
            unit="g"
            dailyValue={DAILY_VALUES.sodium}
          />
          <NutritionBar
            label="Fat"
            value={summary.totalFat}
            max={DAILY_VALUES.fat}
            unit="g"
            dailyValue={DAILY_VALUES.fat}
          />
          <NutritionBar
            label="Protein"
            value={summary.totalProtein}
            max={DAILY_VALUES.protein}
            unit="g"
            dailyValue={DAILY_VALUES.protein}
          />
        </View>

        {summary.alerts.length > 0 && (
          <View style={styles.alertsSummary}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              {summary.alerts.length} item{summary.alerts.length > 1 ? 's' : ''} need attention
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  bars: {
    gap: 4,
  },
  alertsSummary: {
    marginTop: 12,
    alignItems: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactBars: {
    flex: 1,
  },
});
