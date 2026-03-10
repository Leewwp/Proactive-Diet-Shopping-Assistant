import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Avatar, Button, Card, Divider, List, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FamilyMemberCard } from '@/components';
import { FamilyMemberEditor } from '@/components/profile/FamilyMemberEditor';
import { COLORS, DARK_COLORS, DIET_GOAL_LABELS, getEmptyAllergenSelections } from '@/constants';
import { useProfileStore } from '@/stores';
import { FamilyMember } from '@/types';

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();

  const {
    profile,
    abTestMode,
    updateProfile,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    resetProfile,
    setAbTestMode,
    incrementDevMenuTap,
  } = useProfileStore();

  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showFamilyEditor, setShowFamilyEditor] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showUserEditor, setShowUserEditor] = useState(false);

  const handleVersionTap = () => {
    if (incrementDevMenuTap()) {
      setShowDevMenu(true);
    }
  };

  const handleAddFamilyMember = () => {
    setEditingMember(null);
    setShowFamilyEditor(true);
  };

  const handleEditFamilyMember = (member: FamilyMember) => {
    setEditingMember(member);
    setShowFamilyEditor(true);
  };

  const handleSaveFamilyMember = (member: FamilyMember) => {
    if (editingMember) {
      updateFamilyMember(member.id, member);
    } else {
      addFamilyMember(member);
    }
    setShowFamilyEditor(false);
    setEditingMember(null);
  };

  const handleEditUser = () => {
    setShowUserEditor(true);
  };

  const handleSaveUser = (member: FamilyMember) => {
    updateProfile({
      name: member.name,
      avatar: member.avatar,
      bodyData: member.bodyData,
      goals: member.goals,
      allergenSelections: member.allergenSelections,
      dailyTargets: member.dailyTargets,
    });
    setShowUserEditor(false);
  };

  const handleResetProfile = () => {
    Alert.alert('Reset Profile', 'This will clear all your data and restart onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetProfile() },
    ]);
  };

  const getAbModeLabel = (mode: string) => {
    switch (mode) {
      case 'A':
        return 'Mode A (Control - No colors/alerts)';
      case 'B':
        return 'Mode B (Full features)';
      case 'C':
        return 'Mode C (Colors only)';
      default:
        return mode;
    }
  };

  const countSelectedAllergens = (selections: unknown): number => {
    if (!selections || typeof selections !== 'object') {
      return 0;
    }

    let count = 0;
    Object.values(selections as Record<string, unknown>).forEach((selection) => {
      if (selection && typeof selection === 'object') {
        const target = selection as { isAllSelected?: boolean; selectedSubItems?: unknown };
        if (target.isAllSelected) {
          count += 1;
        } else if (Array.isArray(target.selectedSubItems)) {
          count += target.selectedSubItems.length;
        }
      }
    });
    return count;
  };

  const userAllergenCount = profile?.allergenSelections
    ? countSelectedAllergens(profile.allergenSelections)
    : 0;

  const userAsFamilyMember: FamilyMember = {
    id: profile?.id || 'user',
    name: profile?.name || 'User',
    avatar: profile?.avatar,
    bodyData: profile?.bodyData,
    goals: profile?.goals || [],
    allergenSelections: profile?.allergenSelections || getEmptyAllergenSelections(),
    dailyTargets: profile?.dailyTargets,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.ui.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium">Profile</Text>
        <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }} onPress={handleVersionTap}>
          Version 1.0.0
        </Text>
      </View>

      <Card style={[styles.card, styles.userCard, { backgroundColor: colors.ui.surface }]}>
        <View style={styles.userCardContent}>
          <View style={styles.userInfo}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.userAvatar} />
            ) : (
              <Avatar.Text
                size={56}
                label={
                  profile?.name
                    ?.split(' ')
                    .map((namePart) => namePart[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'
                }
                style={{ backgroundColor: colors.ui.primary }}
                color="#FFFFFF"
              />
            )}
            <View style={styles.userDetails}>
              <Text variant="titleLarge" style={styles.userName}>
                {profile?.name || 'User'}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                {profile?.goals?.length || 0} goals | {userAllergenCount} allergens
              </Text>
              {profile?.bodyData?.weight && (
                <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                  {profile.bodyData.weight}kg | {profile.bodyData.height}cm | {profile.bodyData.age}y
                </Text>
              )}
            </View>
          </View>
          <Button mode="contained" onPress={handleEditUser} icon="pencil" compact>
            Edit
          </Button>
        </View>

        {profile?.goals && profile.goals.length > 0 && (
          <View style={styles.userGoals}>
            {profile.goals.slice(0, 3).map((goal) => (
              <View key={goal} style={[styles.goalTag, { backgroundColor: `${colors.ui.primary}1F` }]}>
                <Text style={{ color: colors.ui.primary, fontSize: 12 }}>{DIET_GOAL_LABELS[goal]}</Text>
              </View>
            ))}
            {profile.goals.length > 3 && (
              <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                +{profile.goals.length - 3} more
              </Text>
            )}
          </View>
        )}
      </Card>

      <Card style={[styles.card, { backgroundColor: colors.ui.surface }]}>
        <Card.Title title="Family Members" subtitle={`${profile?.familyMembers?.length || 0} members`} />
        <Card.Content>
          {profile?.familyMembers && profile.familyMembers.length > 0 ? (
            profile.familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={() => handleEditFamilyMember(member)}
                onRemove={() => removeFamilyMember(member.id)}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center', padding: 16 }}>
              Add family members to track their dietary needs.
            </Text>
          )}
          <Button mode="outlined" onPress={handleAddFamilyMember} style={{ marginTop: 12 }} icon="plus">
            Add Family Member
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: colors.ui.surface }]}>
        <Card.Title title="Shopping History" />
        <Card.Content>
          <List.Item
            title="Total Scans"
            description="0 products scanned"
            left={(props) => <List.Icon {...props} icon="barcode" />}
          />
          <List.Item
            title="Items in Cart"
            description="0 items"
            left={(props) => <List.Icon {...props} icon="cart" />}
          />
        </Card.Content>
      </Card>

      {showDevMenu && (
        <Card style={[styles.card, { backgroundColor: colors.ui.surface }]}>
          <Card.Title title="Developer Menu" subtitle="A/B Test Configuration" />
          <Card.Content>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Test Mode
            </Text>
            {(['A', 'B', 'C'] as const).map((mode) => (
              <List.Item
                key={mode}
                title={getAbModeLabel(mode)}
                onPress={() => setAbTestMode(mode)}
                right={() => (abTestMode === mode ? <List.Icon icon="check" /> : null)}
              />
            ))}
            <Divider style={{ marginVertical: 12 }} />
            <Button mode="contained" onPress={handleResetProfile}>
              Reset Profile
            </Button>
          </Card.Content>
        </Card>
      )}

      <FamilyMemberEditor
        visible={showFamilyEditor}
        member={editingMember || undefined}
        onSave={handleSaveFamilyMember}
        onClose={() => {
          setShowFamilyEditor(false);
          setEditingMember(null);
        }}
      />

      <FamilyMemberEditor
        visible={showUserEditor}
        member={userAsFamilyMember}
        onSave={handleSaveUser}
        onClose={() => setShowUserEditor(false)}
      />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
  },
  userCard: {
    padding: 16,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
  },
  userGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  goalTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
});
