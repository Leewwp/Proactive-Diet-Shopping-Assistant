import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartItemComponent, CartSummary, NutritionMeter } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import { useCartStore, useProfileStore } from '@/stores';
import { determineAlertLevel } from '@/utils';

export function CartScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useProfileStore();
  const { items, summary, updateQuantity, removeItem, clearCart } = useCartStore();

  const handleItemPress = (barcode: string) => {
    router.push(`/product/${barcode}`);
  };

  const handleCheckout = () => {
    router.push('/summary');
  };

  const getAlertLevel = (barcode: string) => {
    const item = items.find((i) => i.product.barcode === barcode);
    if (!item || !profile) return 'compliant';
    return determineAlertLevel(item.product, profile).level;
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          Your cart is empty
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center' }}>
          Scan products to add them to your cart
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/scan')}
          style={styles.scanButton}
        >
          Start Scanning
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
      <NutritionMeter summary={summary} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 200 }}
        renderItem={({ item }) => (
          <CartItemComponent
            item={item}
            alertLevel={getAlertLevel(item.product.barcode)}
            onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
            onPress={() => handleItemPress(item.product.barcode)}
          />
        )}
      />

      <View style={styles.summaryContainer}>
        <CartSummary
          summary={summary}
          onCheckout={handleCheckout}
          onClear={clearCart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scanButton: {
    marginTop: 24,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
