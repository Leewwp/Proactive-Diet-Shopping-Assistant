import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertCard, ComplianceBadge } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import { fetchProductByBarcode } from '@/services';
import { useCartStore, useProductStore, useProfileStore } from '@/stores';
import { Product } from '@/types';
import { checkFamilyConflicts, DAILY_VALUES, determineAlertLevel } from '@/utils';

export function ProductDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const { profile, abTestMode } = useProfileStore();
  const { getCachedProduct, cacheProduct, addRecentScan, addToComparison } = useProductStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);

  const showColors = abTestMode !== 'A';
  const showAlerts = abTestMode === 'B';

  const handleAddToCart = useCallback(() => {
    if (!product) {
      return;
    }

    addItem(product);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    router.back();
  }, [addItem, product, router]);

  const loadProduct = useCallback(async () => {
    if (!barcode) {
      return;
    }

    setIsLoading(true);

    let productData = getCachedProduct(barcode);
    if (!productData) {
      productData = (await fetchProductByBarcode(barcode)) ?? undefined;
      if (productData) {
        cacheProduct(productData);
        addRecentScan(productData);
      }
    }

    setProduct(productData);
    setIsLoading(false);

    if (productData && profile) {
      const alert = determineAlertLevel(productData, profile);
      if (alert.level === 'emergency') {
        setShowEmergencyOverlay(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
  }, [addRecentScan, barcode, cacheProduct, getCachedProduct, profile]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleCompare = () => {
    if (product) {
      addToComparison(product);
      router.push(`/scan?compare=true&slot=B` as any);
    }
  };

  const handleFindAlternatives = () => {
    if (product) {
      router.push(`/alternatives/${product.barcode}`);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.ui.background }]}>
        <Text variant="bodyLarge">Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.ui.background }]}>
        <Text variant="bodyLarge">Product not found</Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Go Back
        </Button>
      </View>
    );
  }

  const alert = profile ? determineAlertLevel(product, profile) : null;
  const familyConflicts = profile ? checkFamilyConflicts(product, profile.familyMembers) : [];

  const nutritionGrid = [
    { label: 'Calories', value: product.nutrition.calories, unit: 'kcal', daily: DAILY_VALUES.calories },
    { label: 'Sugar', value: product.nutrition.sugar, unit: 'g', daily: DAILY_VALUES.sugar },
    { label: 'Fat', value: product.nutrition.fat, unit: 'g', daily: DAILY_VALUES.fat },
    { label: 'Sodium', value: product.nutrition.sodium, unit: 'g', daily: DAILY_VALUES.sodium },
    { label: 'Protein', value: product.nutrition.protein, unit: 'g', daily: DAILY_VALUES.protein },
    { label: 'Fiber', value: product.nutrition.fiber, unit: 'g', daily: DAILY_VALUES.fiber },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      {showEmergencyOverlay && alert?.level === 'emergency' && (
        <View style={styles.emergencyOverlay}>
          <View style={styles.emergencyContent}>
            <Text variant="headlineMedium" style={styles.emergencyTitle}>
              ALLERGEN ALERT
            </Text>
            <Text variant="bodyLarge" style={styles.emergencyMessage}>
              {alert.message}
            </Text>
            <Button mode="contained" onPress={() => setShowEmergencyOverlay(false)} style={styles.emergencyButton}>
              I Understand
            </Button>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}>
        {product.imageUrl && <Image source={{ uri: product.imageUrl }} style={styles.productImage} />}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="headlineSmall">{product.name}</Text>
              {product.brand && (
                <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
                  {product.brand}
                </Text>
              )}
            </View>
            {product.nutriScore && (
              <View style={[styles.nutriScoreBadge, { backgroundColor: colors.nutriScore[product.nutriScore] }]}>
                <Text variant="titleMedium" style={styles.nutriScoreText}>
                  {product.nutriScore}
                </Text>
              </View>
            )}
          </View>

          {showAlerts && alert && alert.level !== 'compliant' && (
            <AlertCard
              level={alert.level}
              title={alert.level === 'emergency' ? 'Allergen Warning' : alert.level === 'suggestion' ? 'Caution' : 'Tip'}
              message={alert.message}
              visible={!showEmergencyOverlay}
            />
          )}

          {familyConflicts.length > 0 && showAlerts && (
            <Card style={[styles.conflictCard, { backgroundColor: `${colors.compliance.suggestion}1F` }]}>
              <Card.Content>
                <Text variant="titleSmall">Family Conflict</Text>
                {familyConflicts.map(({ member, alert: conflictAlert }) => (
                  <Text key={member.id} variant="bodySmall" style={{ marginTop: 4 }}>
                    - {conflictAlert.message}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          )}

          <Card style={[styles.nutritionCard, { backgroundColor: colors.ui.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Nutrition per 100g
              </Text>

              <View style={styles.nutritionGrid}>
                {nutritionGrid.map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.nutritionItem,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' },
                    ]}
                  >
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      {item.label}
                    </Text>
                    <Text variant="titleMedium">
                      {item.value.toFixed(1)}
                      {item.unit}
                    </Text>
                    {showColors && (
                      <ComplianceBadge
                        level={item.value / item.daily > 0.8 ? 'suggestion' : 'compliant'}
                        size="small"
                      />
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {product.allergens.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Contains
              </Text>
              <View style={styles.chipWrap}>
                {product.allergens.slice(0, 6).map((allergen) => (
                  <Chip key={allergen} mode="outlined" compact>
                    {allergen}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {product.categories.length > 0 && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Categories
              </Text>
              <View style={styles.chipWrap}>
                {product.categories.slice(0, 4).map((category) => (
                  <Chip key={category} mode="flat" compact>
                    {category}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionSection}>
            <Button
              mode="outlined"
              onPress={handleFindAlternatives}
              icon="swap-horizontal"
              style={styles.alternativesButton}
              contentStyle={styles.alternativesButtonContent}
            >
              Find Healthier Alternatives
            </Button>
          </View>
        </View>
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
        <Button mode="outlined" onPress={handleCompare} icon="compare" style={styles.footerButton}>
          Compare
        </Button>
        <Button mode="contained" onPress={handleAddToCart} icon="plus" style={styles.footerButton}>
          Add to Cart
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
  productImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  nutriScoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutriScoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  conflictCard: {
    marginVertical: 12,
    borderRadius: 12,
  },
  nutritionCard: {
    marginVertical: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  nutritionItem: {
    width: '31.5%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  section: {
    marginTop: 16,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  alternativesButton: {
    borderRadius: 12,
  },
  alternativesButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  emergencyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(188, 32, 40, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 24,
  },
  emergencyContent: {
    alignItems: 'center',
  },
  emergencyTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyMessage: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emergencyButton: {
    backgroundColor: '#FFFFFF',
  },
});
