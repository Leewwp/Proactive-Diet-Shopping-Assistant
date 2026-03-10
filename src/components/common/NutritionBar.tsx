import { COLORS, DARK_COLORS } from '@/constants';
import { getMeterColorByPercentage } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';

interface NutritionBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  showPercentage?: boolean;
  dailyValue?: number;
}

export function NutritionBar({
  label,
  value,
  max,
  unit = 'g',
  showPercentage = true,
  dailyValue,
}: NutritionBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const percentage = dailyValue
    ? Math.round((value / dailyValue) * 100)
    : Math.round((value / max) * 100);

  const progress = Math.min(percentage / 100, 1);
  const barColor = getMeterColorByPercentage(percentage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          variant="labelMedium"
          style={{ color: isDark ? colors.ui.textSecondary : colors.ui.textSecondary }}
        >
          {label}
        </Text>
        <Text
          variant="labelMedium"
          style={{ color: barColor, fontWeight: '600' }}
        >
          {value.toFixed(1)}{unit}
          {showPercentage && dailyValue && ` (${percentage}%)`}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={barColor}
        style={styles.progressBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
