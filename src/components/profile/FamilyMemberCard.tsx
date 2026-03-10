import { BORDER_RADIUS, COLORS, DARK_COLORS, SPACING } from '@/constants';
import { FamilyMember } from '@/types';
import React from 'react';
import { Alert, Image, StyleSheet, useColorScheme, View } from 'react-native';
import { Avatar, Card, IconButton, Text } from 'react-native-paper';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: () => void;
  onRemove?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function FamilyMemberCard({
  member,
  onEdit,
  onRemove,
  isSelected = false,
  onSelect,
}: FamilyMemberCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove "${member.name}" from your family members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => onRemove?.(),
        }
      ]
    );
  };

  const countSelectedAllergens = (): number => {
    try {
      if (!member.allergenSelections) return 0;
      const selections = member.allergenSelections;
      if (typeof selections !== 'object') return 0;
      
      let count = 0;
      Object.values(selections).forEach((selection: unknown) => {
        if (selection && typeof selection === 'object') {
          const sel = selection as { isAllSelected?: boolean; selectedSubItems?: unknown[] };
          if (sel.isAllSelected) {
            count += 1;
          } else if (Array.isArray(sel.selectedSubItems)) {
            count += sel.selectedSubItems.length;
          }
        }
      });
      
      return count;
    } catch {
      return 0;
    }
  };

  const allergenCount = countSelectedAllergens();
  const goals = member.goals || [];

  return (
    <View style={styles.outerContainer}>
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.ui.surface : colors.ui.surface,
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? colors.ui.primary : 'transparent',
          },
        ]}
        onPress={onSelect}
      >
        <View style={styles.mainRow}>
          <View style={styles.avatarSection}>
            {member.avatar ? (
              <Image source={{ uri: member.avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={44}
                label={getInitials(member.name || 'Unknown')}
                style={{ backgroundColor: colors.ui.primary }}
                color="white"
              />
            )}
          </View>

          <View style={styles.infoSection}>
            <Text variant="titleMedium" style={styles.memberName}>
              {member.name || 'Unknown'}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
              {goals.length} goal{goals.length !== 1 ? 's' : ''}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
              {allergenCount} allergen{allergenCount !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.actionSection}>
            <View style={styles.buttonRow}>
              {onEdit && (
                <IconButton 
                  icon="pencil" 
                  size={20} 
                  onPress={onEdit}
                  style={styles.iconButton}
                />
              )}
              {onRemove && (
                <IconButton 
                  icon="delete" 
                  size={20} 
                  onPress={handleRemove}
                  iconColor={colors.ui.error}
                  style={styles.iconButton}
                />
              )}
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: 4,
    marginHorizontal: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  avatarSection: {
    width: 44,
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  infoSection: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontWeight: '600',
    fontSize: 15,
  },
  actionSection: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
  },
});
