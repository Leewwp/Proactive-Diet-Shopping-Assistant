import { COLORS, DARK_COLORS } from '@/constants';
import { getMeterColorByPercentage } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Polygon } from 'react-native-svg';

interface NutritionRadarChartProps {
  data: {
    label: string;
    value: number;
    max: number;
  }[];
  size?: number;
}

export function NutritionRadarChart({ data, size = 200 }: NutritionRadarChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const center = size / 2;
  const radius = size / 2 - 20;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (index: number, value: number, max: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const backgroundPoints = data.map((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
  }).join(' ');

  const dataPoints = data.map((item, index) => {
    const point = getPoint(index, item.value, item.max);
    return `${point.x},${point.y}`;
  }).join(' ');

  const averagePercentage = data.reduce((sum, item) => {
    return sum + (item.value / item.max) * 100;
  }, 0) / data.length;

  const strokeColor = getMeterColorByPercentage(averagePercentage);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Polygon
          points={backgroundPoints}
          fill="none"
          stroke={isDark ? '#333' : '#E0E0E0'}
          strokeWidth={1}
        />
        <Polygon
          points={dataPoints}
          fill={`${strokeColor}40`}
          stroke={strokeColor}
          strokeWidth={2}
        />
      </Svg>
      <View style={styles.labels}>
        {data.map((item, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const labelRadius = radius + 15;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);

          return (
            <Text
              key={item.label}
              variant="labelSmall"
              style={[
                styles.label,
                {
                  position: 'absolute',
                  left: x - 20,
                  top: y - 8,
                  color: isDark ? colors.ui.text : colors.ui.textSecondary,
                },
              ]}
            >
              {item.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    position: 'absolute',
  },
  label: {
    width: 40,
    textAlign: 'center',
  },
});
