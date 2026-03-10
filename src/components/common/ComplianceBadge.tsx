import { COLORS, DARK_COLORS } from '@/constants';
import { AlertLevel } from '@/types';
import { getComplianceColor } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface ComplianceBadgeProps {
  level: AlertLevel;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function ComplianceBadge({
  level,
  message,
  size = 'medium',
  showIcon = true,
}: ComplianceBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const color = getComplianceColor(level);

  const getLabel = () => {
    switch (level) {
      case 'emergency':
        return '⚠️ ALERT';
      case 'suggestion':
        return '⚡ CAUTION';
      case 'optimization':
        return '💡 TIP';
      case 'compliant':
        return '✓ OK';
      default:
        return '';
    }
  };

  const sizeStyles = {
    small: { height: 24 },
    medium: { height: 32 },
    large: { height: 40 },
  };

  return (
    <View style={[styles.container, sizeStyles[size]]}>
      <Chip
        mode="flat"
        style={[styles.chip, { backgroundColor: `${color}20` }]}
        textStyle={[styles.chipText, { color }]}
      >
        {getLabel()}
      </Chip>
      {message && size !== 'small' && (
        <Text
          variant="bodySmall"
          style={[styles.message, { color: isDark ? colors.ui.textSecondary : colors.ui.textSecondary }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 12,
  },
  message: {
    flex: 1,
  },
});
