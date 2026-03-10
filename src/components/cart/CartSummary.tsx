import { COLORS, DARK_COLORS } from '@/constants';
import { CartNutritionSummary } from '@/types';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

interface CartSummaryProps {
  summary: CartNutritionSummary;
  onCheckout: () => void;
  onClear: () => void;
}

export function CartSummary({ summary, onCheckout, onClear }: CartSummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const { itemCount, complianceScore, alerts } = summary;

  const getComplianceMessage = () => {
    if (complianceScore >= 80) {
      return 'Great choices! Your cart is well-balanced.';
    } else if (complianceScore >= 50) {
      return 'Some items could be improved.';
    } else {
      return 'Consider reviewing some items in your cart.';
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
      <Card.Content>
        <View style={styles.row}>
          <Text variant="titleMedium">Cart Summary</Text>
          <Text variant="titleMedium">{itemCount} items</Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="displaySmall" style={{ color: colors.ui.primary }}>
              {complianceScore}%
            </Text>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              Compliance Score
            </Text>
          </View>

          <View style={styles.stat}>
            <Text variant="displaySmall" style={{ color: alerts.length > 0 ? colors.compliance.suggestion : colors.compliance.compliant }}>
              {alerts.length}
            </Text>
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
              Alerts
            </Text>
          </View>
        </View>

        <Text variant="bodySmall" style={[styles.message, { color: colors.ui.textSecondary }]}>
          {getComplianceMessage()}
        </Text>
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <Button mode="text" onPress={onClear} textColor={colors.ui.error}>
          Clear Cart
        </Button>
        <Button mode="contained" onPress={onCheckout}>
          View Summary
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  stat: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
