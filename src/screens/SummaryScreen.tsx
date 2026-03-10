import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    Share,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { Button, Card, Chip, Divider, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NutritionRadarChart } from '@/components';
import { COLORS, DARK_COLORS, DIET_GOAL_LABELS } from '@/constants';
import { useCartStore, useProfileStore } from '@/stores';
import { DAILY_VALUES } from '@/utils';

export function SummaryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useProfileStore();
  const { items, summary, clearCart } = useCartStore();

  const { complianceScore, alerts, totalCalories, totalSugar, totalSodium, totalFat, totalProtein } = summary;

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.compliance.compliant;
    if (score >= 50) return colors.compliance.suggestion;
    return colors.compliance.emergency;
  };

  const compliantItems = items.filter((item) => {
    const hasEmergency = alerts.some(
      (a) => a.productId === item.product.barcode && a.level === 'emergency'
    );
    return !hasEmergency;
  });

  const reconsiderItems = items.filter((item) => {
    const hasEmergency = alerts.some(
      (a) => a.productId === item.product.barcode && a.level === 'emergency'
    );
    return hasEmergency;
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My shopping compliance score: ${complianceScore}%!\nItems: ${summary.itemCount}\nCalories: ${totalCalories}\nSugar: ${totalSugar}g\nProtein: ${totalProtein}g`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDone = () => {
    clearCart();
    router.replace('/');
  };

  const radarData = [
    { label: 'Cal', value: totalCalories, max: DAILY_VALUES.calories },
    { label: 'Sugar', value: totalSugar, max: DAILY_VALUES.sugar },
    { label: 'Fat', value: totalFat, max: DAILY_VALUES.fat },
    { label: 'Sodium', value: totalSodium * 1000, max: DAILY_VALUES.sodium * 1000 },
    { label: 'Protein', value: totalProtein, max: DAILY_VALUES.protein },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.ui.background : colors.ui.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Shopping Summary</Text>
          <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <Card style={[styles.scoreCard, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
          <Card.Content style={styles.scoreContent}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(complianceScore) }]}>
              <Text variant="displayMedium" style={{ color: getScoreColor(complianceScore), fontWeight: '700' }}>
                {complianceScore}
              </Text>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>
                Score
              </Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text variant="titleMedium">
                {complianceScore >= 80
                  ? 'Excellent choices!'
                  : complianceScore >= 50
                  ? 'Good progress!'
                  : 'Room for improvement'}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
                {summary.itemCount} items scanned
              </Text>
              <View style={styles.scoreBar}>
                <ProgressBar
                  progress={complianceScore / 100}
                  color={getScoreColor(complianceScore)}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
          <Card.Title title="Nutrition Overview" />
          <Card.Content style={styles.radarContainer}>
            <NutritionRadarChart data={radarData} size={220} />
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
          <Card.Title title="Per-Metric Breakdown" />
          <Card.Content>
            <View style={styles.metricRow}>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>Calories</Text>
              <Text variant="labelMedium">{totalCalories} kcal</Text>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {Math.round((totalCalories / DAILY_VALUES.calories) * 100)}% DV
              </Text>
            </View>
            <Divider />
            <View style={styles.metricRow}>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>Sugar</Text>
              <Text variant="labelMedium">{totalSugar}g</Text>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {Math.round((totalSugar / DAILY_VALUES.sugar) * 100)}% DV
              </Text>
            </View>
            <Divider />
            <View style={styles.metricRow}>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>Sodium</Text>
              <Text variant="labelMedium">{totalSodium.toFixed(2)}g</Text>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {Math.round((totalSodium / DAILY_VALUES.sodium) * 100)}% DV
              </Text>
            </View>
            <Divider />
            <View style={styles.metricRow}>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>Fat</Text>
              <Text variant="labelMedium">{totalFat}g</Text>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {Math.round((totalFat / DAILY_VALUES.fat) * 100)}% DV
              </Text>
            </View>
            <Divider />
            <View style={styles.metricRow}>
              <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>Protein</Text>
              <Text variant="labelMedium">{totalProtein}g</Text>
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                {Math.round((totalProtein / DAILY_VALUES.protein) * 100)}% DV
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.itemsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Items that fit your goals ({compliantItems.length})
          </Text>
          {compliantItems.length > 0 ? (
            <View style={styles.itemChips}>
              {compliantItems.map((item) => (
                <Chip
                  key={item.id}
                  mode="flat"
                  style={{ backgroundColor: `${colors.compliance.compliant}20` }}
                  textStyle={{ color: colors.compliance.compliant }}
                >
                  ✓ {item.product.name.substring(0, 15)}
                </Chip>
              ))}
            </View>
          ) : (
            <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary }}>
              No items yet
            </Text>
          )}
        </View>

        {reconsiderItems.length > 0 && (
          <View style={styles.itemsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Items to reconsider ({reconsiderItems.length})
            </Text>
            <View style={styles.itemChips}>
              {reconsiderItems.map((item) => (
                <Chip
                  key={item.id}
                  mode="flat"
                  style={{ backgroundColor: `${colors.compliance.emergency}20` }}
                  textStyle={{ color: colors.compliance.emergency }}
                >
                  ⚠️ {item.product.name.substring(0, 15)}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {profile?.familyMembers && profile.familyMembers.length > 0 && (
          <Card style={[styles.card, { backgroundColor: isDark ? colors.ui.surface : colors.ui.surface }]}>
            <Card.Title title="Family Breakdown" />
            <Card.Content>
              {profile.familyMembers.map((member) => (
                <View key={member.id} style={styles.familyRow}>
                  <Text variant="labelMedium">{member.name}</Text>
                  <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                    {member.goals.map((g) => DIET_GOAL_LABELS[g]).join(', ') || 'No goals set'}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button mode="outlined" onPress={handleShare} icon="share">
          Share
        </Button>
        <Button mode="contained" onPress={handleDone}>
          Done
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
    marginBottom: 16,
  },
  scoreCard: {
    marginHorizontal: 16,
    borderRadius: 16,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 24,
  },
  scoreBar: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  itemChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyRow: {
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
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
