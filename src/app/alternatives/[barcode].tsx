import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlternativesList } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import { fetchProductByBarcode, findBetterAlternatives } from '@/services';
import { AlternativeProduct } from '@/services/alternativeFinder';
import { useProductStore, useProfileStore } from '@/stores';
import { Product } from '@/types';

export default function AlternativesRoute() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const { profile } = useProfileStore();
  const { getCachedProduct, cacheProduct } = useProductStore();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlternatives = useCallback(async () => {
    if (!barcode || !profile) return;

    setIsLoading(true);

    let productData = getCachedProduct(barcode);
    if (!productData) {
      productData = await fetchProductByBarcode(barcode) ?? undefined;
      if (productData) {
        cacheProduct(productData);
      }
    }

    if (productData) {
      setProduct(productData);
      const alts = await findBetterAlternatives(productData, profile);
      setAlternatives(alts);
    }

    setIsLoading(false);
  }, [barcode, cacheProduct, getCachedProduct, profile]);

  useEffect(() => {
    loadAlternatives();
  }, [loadAlternatives]);

  const handleSelectAlternative = (alt: Product) => {
    router.push(`/product/${alt.barcode}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
        <ActivityIndicator size="large" color={colors.ui.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
        <Text variant="bodyLarge">Product not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background, paddingTop: insets.top + 16 }]}>
      <AlternativesList
        alternatives={alternatives}
        originalProduct={product}
        onSelect={handleSelectAlternative}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
