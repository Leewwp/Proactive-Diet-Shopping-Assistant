import { COLORS, DARK_COLORS } from '@/constants';
import { AlternativeProduct } from '@/services';
import { Product } from '@/types';
import React from 'react';
import { Image, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

interface AlternativesListProps {
  alternatives: AlternativeProduct[];
  onSelect: (product: Product) => void;
  originalProduct: Product;
}

export function AlternativesList({
  alternatives,
  onSelect,
  originalProduct,
}: AlternativesListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  if (alternatives.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
          No better alternatives found for this product.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Better Alternatives
      </Text>

      {alternatives.map((alt) => (
        <Card
          key={alt.barcode}
          style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
          onPress={() => onSelect(alt)}
        >
          <View style={styles.content}>
            {alt.imageUrl ? (
              <Image source={{ uri: alt.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Text variant="labelSmall">No Image</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text variant="labelLarge" numberOfLines={2}>
                {alt.name}
              </Text>
              {alt.brand && (
                <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                  {alt.brand}
                </Text>
              )}

              <View style={styles.improvements}>
                {alt.improvements.slice(0, 2).map((improvement, index) => (
                  <Chip
                    key={index}
                    mode="flat"
                    compact
                    style={{ backgroundColor: `${colors.comparison.better}20` }}
                    textStyle={{ color: colors.comparison.better, fontSize: 10 }}
                  >
                    {improvement.substring(0, 20)}...
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.scoreContainer}>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                Score
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: alt.improvementScore > 0 ? colors.comparison.better : colors.ui.text }}
              >
                +{alt.improvementScore}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  improvements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
