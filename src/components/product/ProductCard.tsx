import { COLORS, DARK_COLORS } from '@/constants';
import { AlertLevel, Product } from '@/types';
import React from 'react';
import { Image, StyleSheet, useColorScheme, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ComplianceBadge } from '../common';

interface ProductCardProps {
  product: Product;
  alertLevel?: AlertLevel;
  onPress?: () => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  alertLevel = 'compliant',
  onPress,
  compact = false,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const getNutriScoreColor = (score?: string) => {
    if (!score) return colors.ui.textSecondary;
    return colors.nutriScore[score as keyof typeof colors.nutriScore] || colors.ui.textSecondary;
  };

  if (compact) {
    return (
      <Card
        style={[styles.compactCard, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
        onPress={onPress}
      >
        <View style={styles.compactContent}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImage, styles.placeholderImage]}>
              <Text variant="labelSmall">No Image</Text>
            </View>
          )}
          <View style={styles.compactInfo}>
            <Text variant="labelMedium" numberOfLines={1}>
              {product.name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
              {product.brand}
            </Text>
            <View style={styles.compactNutrition}>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {product.nutrition.calories} kcal
              </Text>
              {product.nutriScore && (
                <View
                  style={[
                    styles.nutriScoreBadge,
                    { backgroundColor: getNutriScoreColor(product.nutriScore) },
                  ]}
                >
                  <Text variant="labelSmall" style={{ color: 'white', fontWeight: '700' }}>
                    {product.nutriScore}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <ComplianceBadge level={alertLevel} size="small" />
        </View>
      </Card>
    );
  }

  return (
    <Card
      style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
      onPress={onPress}
    >
      <Card.Cover
        source={product.imageUrl ? { uri: product.imageUrl } : require('@/assets/images/icon.png')}
        style={styles.image}
      />
      <Card.Content>
        <Text variant="titleMedium" numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && (
          <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
            {product.brand}
          </Text>
        )}

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              Calories
            </Text>
            <Text variant="labelLarge">{product.nutrition.calories}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              Sugar
            </Text>
            <Text variant="labelLarge">{product.nutrition.sugar}g</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              Fat
            </Text>
            <Text variant="labelLarge">{product.nutrition.fat}g</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {product.nutriScore && (
            <View
              style={[
                styles.nutriScoreBadge,
                { backgroundColor: getNutriScoreColor(product.nutriScore) },
              ]}
            >
              <Text variant="labelMedium" style={{ color: 'white', fontWeight: '700' }}>
                Nutri-Score {product.nutriScore}
              </Text>
            </View>
          )}
          <ComplianceBadge level={alertLevel} />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactCard: {
    marginVertical: 4,
    borderRadius: 8,
  },
  image: {
    height: 150,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactNutrition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  nutriScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
});
