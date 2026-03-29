import { COLORS, DARK_COLORS } from '@/constants';
import { ComparisonMetric, Product } from '@/types';
import { getComparisonColor } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Card, Divider, Icon, Text } from 'react-native-paper';

interface ProductComparisonProps {
  productA: Product;
  productB: Product;
  metrics: ComparisonMetric[];
  winner: 'A' | 'B' | 'tie';
  alignmentScore: number;
}

export function ProductComparison({
  productA,
  productB,
  metrics,
  winner,
  alignmentScore,
}: ProductComparisonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const renderTrendIcon = (status: 'better' | 'worse' | 'neutral', color: string) => {
    if (status === 'neutral') {
      return null;
    }

    return <Icon source={status === 'better' ? 'check' : 'arrow-right'} size={14} color={color} />;
  };

  const renderMetricRow = (metric: ComparisonMetric, index: number) => {
    const colorA = getComparisonColor(metric.statusA);
    const colorB = getComparisonColor(metric.statusB);

    return (
      <View key={metric.name}>
        <View style={styles.metricRow}>
          <View style={styles.metricValue}>
            <Text
              variant="labelLarge"
              style={{ color: colorA, fontWeight: metric.statusA === 'better' ? '700' : '400' }}
            >
              {metric.valueA.toFixed(1)}
              {metric.unit}
            </Text>
            {renderTrendIcon(metric.statusA, colorA)}
          </View>

          <View style={styles.metricName}>
            <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>
              {metric.name}
            </Text>
          </View>

          <View style={styles.metricValue}>
            <Text
              variant="labelLarge"
              style={{ color: colorB, fontWeight: metric.statusB === 'better' ? '700' : '400' }}
            >
              {metric.valueB.toFixed(1)}
              {metric.unit}
            </Text>
            {renderTrendIcon(metric.statusB, colorB)}
          </View>
        </View>
        {index < metrics.length - 1 && <Divider />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.productHeader}>
          <Text variant="titleSmall" numberOfLines={1}>
            {productA.name}
          </Text>
          {winner === 'A' && (
            <View style={[styles.winnerBadge, { backgroundColor: colors.comparison.better }]}>
              <Text variant="labelSmall" style={styles.winnerText}>
                Winner
              </Text>
            </View>
          )}
        </View>

        <View style={styles.productHeader}>
          <Text variant="titleSmall" numberOfLines={1}>
            {productB.name}
          </Text>
          {winner === 'B' && (
            <View style={[styles.winnerBadge, { backgroundColor: colors.comparison.better }]}>
              <Text variant="labelSmall" style={styles.winnerText}>
                Winner
              </Text>
            </View>
          )}
        </View>
      </View>

      <Card style={[styles.metricsCard, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>{metrics.map((metric, index) => renderMetricRow(metric, index))}</Card.Content>
      </Card>

      <View style={styles.verdict}>
        <Text variant="titleMedium" style={{ textAlign: 'center' }}>
          {winner === 'tie'
            ? 'Both products are equally aligned with your goals'
            : `Product ${winner} is ${alignmentScore}% more aligned with your goals`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  productHeader: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  winnerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
  },
  winnerText: {
    color: '#FFFFFF',
  },
  metricsCard: {
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricValue: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  metricName: {
    flex: 1,
    alignItems: 'center',
  },
  verdict: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
