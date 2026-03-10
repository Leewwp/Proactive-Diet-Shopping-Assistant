import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductComparison } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import { fetchProductByBarcode } from '@/services';
import { analyzeComparison } from '@/services/nutritionAnalyzer';
import { useCartStore, useProductStore, useProfileStore } from '@/stores';
import { ComparisonMetric, Product } from '@/types';

export function ComparisonScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { barcode } = useLocalSearchParams<{ barcode?: string }>();

  const { profile } = useProfileStore();
  const { comparisonProducts, getCachedProduct, cacheProduct } = useProductStore();
  const { addItem } = useCartStore();

  const [productA, setProductA] = useState<Product | null>(null);
  const [productB, setProductB] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);

    let products = [...comparisonProducts];

    if (barcode && !products.find((p) => p.barcode === barcode)) {
      const product = getCachedProduct(barcode) || await fetchProductByBarcode(barcode);
      if (product) {
        products.push(product);
        cacheProduct(product);
      }
    }

    if (products.length >= 1) {
      setProductA(products[0]);
    }
    if (products.length >= 2) {
      setProductB(products[1]);
    }

    setIsLoading(false);
  }, [barcode, cacheProduct, comparisonProducts, getCachedProduct]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const buildComparisonMetrics = (): ComparisonMetric[] => {
    if (!productA || !productB) return [];

    const metrics: ComparisonMetric[] = [
      {
        name: 'Calories',
        valueA: productA.nutrition.calories,
        valueB: productB.nutrition.calories,
        unit: 'kcal',
        statusA: 'neutral',
        statusB: 'neutral',
      },
      {
        name: 'Sugar',
        valueA: productA.nutrition.sugar,
        valueB: productB.nutrition.sugar,
        unit: 'g',
        statusA: 'neutral',
        statusB: 'neutral',
      },
      {
        name: 'Fat',
        valueA: productA.nutrition.fat,
        valueB: productB.nutrition.fat,
        unit: 'g',
        statusA: 'neutral',
        statusB: 'neutral',
      },
      {
        name: 'Sodium',
        valueA: productA.nutrition.sodium * 1000,
        valueB: productB.nutrition.sodium * 1000,
        unit: 'mg',
        statusA: 'neutral',
        statusB: 'neutral',
      },
      {
        name: 'Protein',
        valueA: productA.nutrition.protein,
        valueB: productB.nutrition.protein,
        unit: 'g',
        statusA: 'neutral',
        statusB: 'neutral',
      },
    ];

    metrics.forEach((metric) => {
      if (metric.valueA < metric.valueB) {
        metric.statusA = metric.name === 'Protein' ? 'worse' : 'better';
        metric.statusB = metric.name === 'Protein' ? 'better' : 'worse';
      } else if (metric.valueA > metric.valueB) {
        metric.statusA = metric.name === 'Protein' ? 'better' : 'worse';
        metric.statusB = metric.name === 'Protein' ? 'worse' : 'better';
      }
    });

    return metrics;
  };

  const getWinner = (): 'A' | 'B' | 'tie' => {
    if (!productA || !productB || !profile) return 'tie';

    const comparison = analyzeComparison(productA, productB, profile);
    return comparison.winner;
  };

  const handleSelectProduct = (product: 'A' | 'B') => {
    const selectedProduct = product === 'A' ? productA : productB;
    if (selectedProduct) {
      addItem(selectedProduct);
      router.back();
    }
  };

  const handleScanAnother = () => {
    router.push('/scan');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
        <ActivityIndicator size="large" color={colors.ui.primary} />
      </View>
    );
  }

  if (!productA || !productB) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          Compare Products
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center' }}>
          Scan two products to compare them side by side
        </Text>

        <View style={styles.productSlots}>
          <Card
            style={[styles.productSlot, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
            onPress={handleScanAnother}
          >
            <Card.Content style={styles.slotContent}>
              <Text variant="titleMedium">
                {productA ? productA.name : 'Product A'}
              </Text>
              {!productA && (
                <Button mode="contained" onPress={handleScanAnother} style={{ marginTop: 12 }}>
                  Scan
                </Button>
              )}
            </Card.Content>
          </Card>

          <Card
            style={[styles.productSlot, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
            onPress={handleScanAnother}
          >
            <Card.Content style={styles.slotContent}>
              <Text variant="titleMedium">
                {productB ? productB.name : 'Product B'}
              </Text>
              {!productB && (
                <Button mode="contained" onPress={handleScanAnother} style={{ marginTop: 12 }}>
                  Scan
                </Button>
              )}
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }

  const metrics = buildComparisonMetrics();
  const winner = getWinner();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      >
        <ProductComparison
          productA={productA}
          productB={productB}
          metrics={metrics}
          winner={winner}
          alignmentScore={75}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.ui.surface,
            borderTopColor: colors.ui.border,
          },
        ]}
      >
        <Button
          mode={winner === 'A' ? 'contained' : 'outlined'}
          onPress={() => handleSelectProduct('A')}
          style={styles.selectButton}
        >
          Choose A
        </Button>
        <Button
          mode={winner === 'B' ? 'contained' : 'outlined'}
          onPress={() => handleSelectProduct('B')}
          style={styles.selectButton}
        >
          Choose B
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginBottom: 12,
  },
  productSlots: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  productSlot: {
    flex: 1,
    borderRadius: 12,
  },
  slotContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  selectButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
