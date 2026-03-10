import { NutritionMeter } from '@/components';
import { COLORS, DARK_COLORS, DIET_GOAL_LABELS } from '@/constants';
import { useCartStore, useProfileStore } from '@/stores';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useProfileStore();
  const { summary, items } = useCartStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.ui.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="headlineMedium">
            {greeting()}, {profile?.name || 'there'}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
            Nutrition-first shopping for your family
          </Text>
        </View>

        {profile?.familyMembers && profile.familyMembers.length > 0 && (
          <View style={styles.familyAvatars}>
            {profile.familyMembers.slice(0, 3).map((member, index) => (
              <Avatar.Text
                key={member.id}
                size={34}
                label={member.name.substring(0, 2).toUpperCase()}
                style={[
                  styles.avatar,
                  { backgroundColor: colors.ui.primary, marginLeft: index > 0 ? -9 : 0 },
                ]}
                color="#FFFFFF"
              />
            ))}
            {profile.familyMembers.length > 3 && (
              <Avatar.Text
                size={34}
                label={`+${profile.familyMembers.length - 3}`}
                style={[styles.avatar, { marginLeft: -9, backgroundColor: colors.ui.textSecondary }]}
                color="#FFFFFF"
              />
            )}
          </View>
        )}
      </View>

      {profile?.goals && profile.goals.length > 0 && (
        <View style={styles.goalsContainer}>
          {profile.goals.map((goal) => (
            <Chip
              key={goal}
              mode="flat"
              style={{ backgroundColor: `${colors.ui.primary}1F` }}
              textStyle={{ color: colors.ui.primary }}
            >
              {DIET_GOAL_LABELS[goal]}
            </Chip>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Card style={[styles.actionCard, { backgroundColor: colors.ui.primary }]} onPress={() => router.push('/scan')}>
          <Card.Content style={styles.primaryActionContent}>
            <Avatar.Icon icon="barcode-scan" size={50} style={styles.primaryActionIcon} color="#FFFFFF" />
            <Text variant="titleMedium" style={styles.primaryActionTitle}>
              Scan Product
            </Text>
            <Text variant="bodySmall" style={styles.primaryActionSubtitle}>
              Smart lookup with regional barcode matching
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.secondaryActions}>
          <Card
            style={[styles.secondaryAction, { backgroundColor: colors.ui.surface }]}
            onPress={() => router.push('/cart')}
          >
            <Card.Content style={styles.secondaryActionContent}>
              <View style={styles.actionIcon}>
                <Avatar.Icon
                  icon="cart"
                  size={42}
                  style={{ backgroundColor: `${colors.ui.primary}24` }}
                  color={colors.ui.primary}
                />
                {items.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.ui.error }]}>
                    <Text variant="labelSmall" style={styles.badgeText}>
                      {summary.itemCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="labelLarge">View Cart</Text>
              <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                {summary.complianceScore}% compliant
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.secondaryAction, { backgroundColor: colors.ui.surface }]}
            onPress={() => router.push('/compare')}
          >
            <Card.Content style={styles.secondaryActionContent}>
              <Avatar.Icon
                icon="compare"
                size={42}
                style={{ backgroundColor: `${colors.ui.primary}24` }}
                color={colors.ui.primary}
              />
              <Text variant="labelLarge">Compare</Text>
              <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                Side by side analysis
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {items.length > 0 && (
        <View style={styles.summarySection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Today Cart Summary
          </Text>
          <NutritionMeter summary={summary} compact />
        </View>
      )}

      <Card style={[styles.tipCard, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleSmall">Quick Tip</Text>
          <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, marginTop: 8 }}>
            Scan products while you shop to catch conflicts before checkout.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  familyAvatars: {
    flexDirection: 'row',
    paddingTop: 4,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  actions: {
    paddingHorizontal: 16,
    gap: 14,
  },
  actionCard: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
  },
  primaryActionContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  primaryActionIcon: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    marginTop: 8,
  },
  primaryActionSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    marginTop: 2,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
  },
  secondaryActionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
  },
  summarySection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  tipCard: {
    margin: 16,
    marginTop: 18,
    borderRadius: 16,
  },
});
