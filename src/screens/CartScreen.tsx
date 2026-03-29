import { CartItemComponent } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import { useCartStore, useProfileStore } from '@/stores';
import { CartItem } from '@/types';
import { calculateCartNutrition, checkCartConflicts } from '@/utils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useColorScheme,
  View
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CartScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useProfileStore();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const [showNutrition, setShowNutrition] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const totalNutrition = calculateCartNutrition(items);
  const conflicts = profile ? checkCartConflicts(items, profile) : [];

  const totalPrice = items.reduce((sum: number, item: CartItem) => {
    return sum + (item.product.quantity ? parseFloat(item.product.quantity) * 10 : 10) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    clearCart();
    router.push('/summary');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onIncrease={() => updateQuantity(item.product.barcode, item.quantity + 1)}
      onDecrease={() => updateQuantity(item.product.barcode, Math.max(1, item.quantity - 1))}
      onRemove={() => removeItem(item.product.barcode)}
      onPress={() => router.push(`/product/${item.product.barcode}` as const)}
    />
  );

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.ui.background }]}>
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          Your cart is empty
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center' }}>
          Scan products to add them to your cart
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/scan')}
          style={{ marginTop: 24 }}
          icon="barcode-scan"
        >
          Start Scanning
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text variant="headlineSmall">Shopping Cart</Text>
        <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item: CartItem) => item.product.barcode}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        ListHeaderComponent={
          <>
            {conflicts.length > 0 && (
              <Card style={[styles.conflictCard, { backgroundColor: `${colors.compliance.emergency}1F` }]}>
                <Card.Content>
                  <Text variant="titleSmall" style={{ color: colors.compliance.emergency }}>
                    Cart Conflicts Detected
                  </Text>
                  {conflicts.slice(0, 2).map((conflict, index) => (
                    <Text key={index} variant="bodySmall" style={{ marginTop: 4 }}>
                      - {conflict.message}
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            )}

            <List.Accordion
              title="Nutrition Balance"
              description={`${totalNutrition.calories} kcal total`}
              expanded={showNutrition}
              onPress={() => setShowNutrition(!showNutrition)}
              style={[styles.accordion, { backgroundColor: colors.ui.surface }]}
              titleStyle={{ fontWeight: '600' }}
              left={(props) => <List.Icon {...props} icon="chart-bar" />}
            >
              <View style={[styles.accordionContent, { backgroundColor: colors.ui.surface }]}>
                <Text variant="bodyMedium">Calories: {totalNutrition.calories} kcal</Text>
                <Text variant="bodyMedium">Sugar: {totalNutrition.sugar}g</Text>
                <Text variant="bodyMedium">Fat: {totalNutrition.fat}g</Text>
                <Text variant="bodyMedium">Protein: {totalNutrition.protein}g</Text>
                <Text variant="bodyMedium">Sodium: {totalNutrition.sodium}g</Text>
              </View>
            </List.Accordion>

            <List.Accordion
              title="Cart Summary"
              description={`Total: $${totalPrice.toFixed(2)}`}
              expanded={showSummary}
              onPress={() => setShowSummary(!showSummary)}
              style={[styles.accordion, { backgroundColor: colors.ui.surface }]}
              titleStyle={{ fontWeight: '600' }}
              left={(props) => <List.Icon {...props} icon="receipt" />}
            >
              <View style={[styles.accordionContent, { backgroundColor: colors.ui.surface }]}>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">Items</Text>
                  <Text variant="bodyMedium">{items.length}</Text>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">Total Calories</Text>
                  <Text variant="bodyMedium">{totalNutrition.calories} kcal</Text>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">Estimated Total</Text>
                  <Text variant="titleMedium">${totalPrice.toFixed(2)}</Text>
                </View>
              </View>
            </List.Accordion>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Items
            </Text>
          </>
        }
        renderItem={renderCartItem}
      />

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
        <View style={styles.footerInfo}>
          <Text variant="bodyMedium">Total</Text>
          <Text variant="titleLarge">${totalPrice.toFixed(2)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          icon="check"
        >
          Checkout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  conflictCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 12,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
  },
  checkoutButton: {
    paddingHorizontal: 24,
  },
});
