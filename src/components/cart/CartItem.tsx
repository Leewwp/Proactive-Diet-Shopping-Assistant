import { COLORS, DARK_COLORS } from '@/constants';
import { CartItem } from '@/types';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';
import { ComplianceBadge } from '../common';

interface CartItemProps {
  item: CartItem;
  alertLevel?: 'emergency' | 'suggestion' | 'optimization' | 'compliant';
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onPress?: () => void;
}

export function CartItemComponent({
  item,
  alertLevel = 'compliant',
  onIncrease,
  onDecrease,
  onRemove,
  onPress,
}: CartItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const { product, quantity } = item;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}
      >
        <View style={styles.content}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text variant="labelSmall">No Image</Text>
            </View>
          )}

          <View style={styles.info}>
            <View style={styles.header}>
              <Text variant="labelLarge" numberOfLines={1} style={styles.name}>
                {product.name}
              </Text>
              <IconButton icon="close" size={18} onPress={onRemove} />
            </View>

            {product.brand && (
              <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                {product.brand}
              </Text>
            )}

            <View style={styles.nutritionHighlights}>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {product.nutrition.calories} kcal • {product.nutrition.sugar}g sugar
              </Text>
              <ComplianceBadge level={alertLevel} size="small" />
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={20}
                  mode="outlined"
                  onPress={onDecrease}
                  disabled={quantity <= 1}
                />
                <Text variant="titleMedium" style={styles.quantity}>
                  {quantity}
                </Text>
                <IconButton
                  icon="plus"
                  size={20}
                  mode="outlined"
                  onPress={onIncrease}
                />
              </View>

              {item.assignedTo && item.assignedTo.length > 0 && (
                <Chip mode="flat" compact>
                  {item.assignedTo.length} member{item.assignedTo.length > 1 ? 's' : ''}
                </Chip>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  nutritionHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
});
