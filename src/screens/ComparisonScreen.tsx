import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Text } from 'react-native-paper';
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
  const { comparisonProducts, getCachedProduct, cacheProduct, addToComparison, clearComparison, removeFromComparison } = useProductStore();
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
        statusA: 'neutral' as const,
        statusB: 'neutral' as const,
      },
      {
        name: 'Sugar',
        valueA: productA.nutrition.sugar,
        valueB: productB.nutrition.sugar,
        unit: 'g',
        statusA: 'neutral' as const,
        statusB: 'neutral' as const,
      },
      {
        name: 'Fat',
        valueA: productA.nutrition.fat,
        valueB: productB.nutrition.fat,
        unit: 'g',
        statusA: 'neutral' as const,
        statusB: 'neutral' as const,
      },
      {
        name: 'Sodium',
        valueA: productA.nutrition.sodium * 1000,
        valueB: productB.nutrition.sodium * 1000,
        unit: 'mg',
        statusA: 'neutral' as const,
        statusB: 'neutral' as const,
      },
      {
        name: 'Protein',
        valueA: productA.nutrition.protein,
        valueB: productB.nutrition.protein,
        unit: 'g',
        statusA: 'neutral' as const,
        statusB: 'neutral' as const,
      },
    ];

    return metrics.map((metric) => {
      const isProtein = metric.name === 'Protein';
      if (metric.valueA < metric.valueB) {
        return {
          ...metric,
          statusA: isProtein ? 'worse' : 'better',
          statusB: isProtein ? 'better' : 'worse',
        };
      } else if (metric.valueA > metric.valueB) {
        return {
          ...metric,
          statusA: isProtein ? 'better' : 'worse',
          statusB: isProtein ? 'worse' : 'better',
        };
      }
      return metric;
    });
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
      clearComparison();
      router.back();
    }
  };

  const handleScanProduct = (slot: 'A' | 'B') => {
    router.push(`/scan?compare=true&slot=${slot}` as any);
  };

  const handleReplaceProduct = (slot: 'A' | 'B') => {
    if (slot === 'A' && productA) {
      removeFromComparison(productA.barcode);
    } else if (slot === 'B' && productB) {
      removeFromComparison(productB.barcode);
    }
    router.push(`/scan?compare=true&slot=${slot}` as any);
  };

  const handleStartNew = () => {
    clearComparison();
    setProductA(null);
    setProductB(null);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.ui.background }]}>
        <ActivityIndicator size="large" color={colors.ui.primary} />
      </View>
    );
  }

  if (!productA || !productB) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.ui.background }]}>
        <View style={styles.emptyHeader}>
          <Text variant="headlineMedium" style={styles.emptyTitle}>
            Compare Products
          </Text>
          <Button mode="text" onPress={handleStartNew} icon="refresh">
            New
          </Button>
        </View>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Scan two products to compare them side by side
        </Text>

        <View style={styles.productSlots}>
          <Card
            style={[styles.productSlot, { backgroundColor: colors.ui.surface }]}
            onPress={() => handleScanProduct('A')}
          >
            <Card.Content style={styles.slotContent}>
              {productA ? (
                <>
                  <Text variant="titleSmall" numberOfLines={2} style={{ textAlign: 'center' }}>
                    {productA.name}
                  </Text>
                  <Button 
                    mode="text" 
                    onPress={() => handleReplaceProduct('A')}
                    style={{ marginTop: 8 }}
                    compact
                    icon="swap-horizontal"
                  >
                    Replace
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="titleMedium">Product A</Text>
                  <Button mode="contained" onPress={() => handleScanProduct('A')} style={{ marginTop: 12 }}>
                    Scan
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>

          <Card
            style={[styles.productSlot, { backgroundColor: colors.ui.surface }]}
            onPress={() => handleScanProduct('B')}
          >
            <Card.Content style={styles.slotContent}>
              {productB ? (
                <>
                  <Text variant="titleSmall" numberOfLines={2} style={{ textAlign: 'center' }}>
                    {productB.name}
                  </Text>
                  <Button 
                    mode="text" 
                    onPress={() => handleReplaceProduct('B')}
                    style={{ marginTop: 8 }}
                    compact
                    icon="swap-horizontal"
                  >
                    Replace
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="titleMedium">Product B</Text>
                  <Button mode="contained" onPress={() => handleScanProduct('B')} style={{ marginTop: 12 }}>
                    Scan
                  </Button>
                </>
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
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.comparisonHeader}>
          <Text variant="titleMedium">Product Comparison</Text>
          <Button mode="text" onPress={handleStartNew} icon="refresh" compact>
            New
          </Button>
        </View>

        <View style={styles.productReplaceRow}>
          <View style={styles.productReplaceItem}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>Product A</Text>
            <Text variant="titleSmall" numberOfLines={1} style={{ flex: 1 }}>
              {productA.name}
            </Text>
            <IconButton
              icon="swap-horizontal"
              size={18}
              mode="outlined"
              onPress={() => handleReplaceProduct('A')}
            />
          </View>
          <View style={styles.productReplaceItem}>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>Product B</Text>
            <Text variant="titleSmall" numberOfLines={1} style={{ flex: 1 }}>
              {productB.name}
            </Text>
            <IconButton
              icon="swap-horizontal"
              size={18}
              mode="outlined"
              onPress={() => handleReplaceProduct('B')}
            />
          </View>
        </View>

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
  emptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    marginRight: 12,
  },
  productSlots: {
    flexDirection: 'row',
    gap: 12,
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
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  productReplaceRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  productReplaceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
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
