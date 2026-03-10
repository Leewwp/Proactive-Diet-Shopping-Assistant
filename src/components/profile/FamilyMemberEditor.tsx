import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Avatar, Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';

import {
  BORDER_RADIUS,
  COLORS,
  DARK_COLORS,
  DIET_GOAL_LABELS,
  SPACING,
  getEmptyAllergenSelections,
} from '@/constants';
import { calculateDailyNutritionTargets } from '@/services/nutritionCalculator';
import { BodyData, DietGoal, FamilyMember } from '@/types';
import { AllergenSelector } from './AllergenSelector';

const { height } = Dimensions.get('window');

interface FamilyMemberEditorProps {
  visible: boolean;
  member?: FamilyMember;
  onSave: (updatedMember: FamilyMember) => void;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((item) => item[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function FamilyMemberEditor({ visible, member, onSave, onClose }: FamilyMemberEditorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [bodyData, setBodyData] = useState<BodyData>({});
  const [goals, setGoals] = useState<DietGoal[]>([]);
  const [allergenSelections, setAllergenSelections] = useState(getEmptyAllergenSelections());
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(member?.name || '');
    setAvatar(member?.avatar);
    setBodyData(member?.bodyData || {});
    setGoals(member?.goals || []);
    setAllergenSelections(member?.allergenSelections || getEmptyAllergenSelections());
    setNameError('');
  }, [member, visible]);

  const handleGoalToggle = (goal: DietGoal) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((targetGoal) => targetGoal !== goal));
      return;
    }
    setGoals([...goals, goal]);
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setAvatar(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Please enter a name');
      return;
    }

    const updatedMember: FamilyMember = {
      id: member?.id || Date.now().toString(),
      name: name.trim(),
      avatar,
      bodyData,
      goals,
      allergenSelections,
      dailyTargets: calculateDailyNutritionTargets(bodyData, goals),
    };

    onSave(updatedMember);
    onClose();
  };

  const dailyTargets = calculateDailyNutritionTargets(bodyData, goals);

  const allergenCount = Object.values(allergenSelections).reduce((accumulator, selection) => {
    if (selection.isAllSelected) {
      return accumulator + 1;
    }
    return accumulator + selection.selectedSubItems.length;
  }, 0);

  const genderLabel = !bodyData.gender
    ? 'Select'
    : bodyData.gender === 'male'
      ? 'Male'
      : bodyData.gender === 'female'
        ? 'Female'
        : 'Other';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.ui.surface }]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={[styles.title, { color: colors.ui.text }]}>
              {member ? 'Edit Profile' : 'New Profile'}
            </Text>
            <Button mode="text" onPress={onClose} textColor={colors.ui.textSecondary}>
              Cancel
            </Button>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.ui.textSecondary }]}>
                Avatar
              </Text>
              <View style={styles.avatarRow}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <Avatar.Text
                    size={64}
                    label={getInitials(name || member?.name || 'User')}
                    style={{ backgroundColor: colors.ui.primary }}
                    color="#FFFFFF"
                  />
                )}
                <View style={styles.avatarActions}>
                  <Button mode="contained" onPress={handlePickAvatar} icon="image-plus">
                    Upload
                  </Button>
                  {avatar && (
                    <Button mode="text" onPress={() => setAvatar(undefined)} textColor={colors.ui.error}>
                      Remove
                    </Button>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.ui.textSecondary }]}>
                Name
              </Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError('');
                }}
                placeholder="Enter name"
                outlineColor={colors.ui.border}
                activeOutlineColor={colors.ui.primary}
                style={styles.input}
                textColor={colors.ui.text}
                placeholderTextColor={colors.ui.textTertiary}
                error={!!nameError}
              />
              {nameError && (
                <Text variant="bodySmall" style={{ color: colors.ui.error, marginTop: 4 }}>
                  {nameError}
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.ui.textSecondary }]}>
                Body Information
              </Text>
              <Text variant="bodySmall" style={[styles.sectionHint, { color: colors.ui.textTertiary }]}>
                Optional - used for personalized nutrition targets
              </Text>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    mode="outlined"
                    label="Weight"
                    keyboardType="numeric"
                    value={bodyData.weight ? String(bodyData.weight) : ''}
                    onChangeText={(text) =>
                      setBodyData({ ...bodyData, weight: text ? parseFloat(text) : undefined })
                    }
                    outlineColor={colors.ui.border}
                    activeOutlineColor={colors.ui.primary}
                    style={styles.input}
                    textColor={colors.ui.text}
                    right={<TextInput.Affix text="kg" />}
                  />
                </View>
                <View style={styles.halfInput}>
                  <TextInput
                    mode="outlined"
                    label="Height"
                    keyboardType="numeric"
                    value={bodyData.height ? String(bodyData.height) : ''}
                    onChangeText={(text) =>
                      setBodyData({ ...bodyData, height: text ? parseFloat(text) : undefined })
                    }
                    outlineColor={colors.ui.border}
                    activeOutlineColor={colors.ui.primary}
                    style={styles.input}
                    textColor={colors.ui.text}
                    right={<TextInput.Affix text="cm" />}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    mode="outlined"
                    label="Age"
                    keyboardType="numeric"
                    value={bodyData.age ? String(bodyData.age) : ''}
                    onChangeText={(text) =>
                      setBodyData({ ...bodyData, age: text ? parseFloat(text) : undefined })
                    }
                    outlineColor={colors.ui.border}
                    activeOutlineColor={colors.ui.primary}
                    style={styles.input}
                    textColor={colors.ui.text}
                    right={<TextInput.Affix text="years" />}
                  />
                </View>
                <View style={styles.halfInput}>
                  <TextInput
                    mode="outlined"
                    label="Gender"
                    value={genderLabel}
                    onPressIn={() => setShowGenderModal(true)}
                    outlineColor={colors.ui.border}
                    activeOutlineColor={colors.ui.primary}
                    style={styles.input}
                    textColor={colors.ui.text}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setShowGenderModal(true)} />}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.ui.textSecondary }]}>
                Diet Goals
              </Text>
              <View style={styles.goalsGrid}>
                {(Object.entries(DIET_GOAL_LABELS) as [DietGoal, string][]).map(([key, label]) => (
                  <Chip
                    key={key}
                    mode={goals.includes(key) ? 'flat' : 'outlined'}
                    onPress={() => handleGoalToggle(key)}
                    style={[
                      styles.goalChip,
                      {
                        backgroundColor: goals.includes(key) ? colors.ui.primary : 'transparent',
                        borderColor: colors.ui.outline,
                      },
                    ]}
                    textStyle={{
                      color: goals.includes(key) ? '#FFFFFF' : colors.ui.text,
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.allergenHeader}>
                <View>
                  <Text
                    variant="labelLarge"
                    style={[styles.sectionLabel, { color: colors.ui.textSecondary, marginBottom: 2 }]}
                  >
                    Allergens
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.ui.textTertiary }}>
                    {allergenCount} selected
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => setShowAllergenModal(true)}
                  style={{ backgroundColor: colors.ui.primary }}
                  contentStyle={{ paddingHorizontal: 16 }}
                >
                  Edit
                </Button>
              </View>
            </View>

            {bodyData.weight && (
              <View style={[styles.targetsCard, { backgroundColor: colors.ui.primaryContainer }]}>
                <Text variant="labelMedium" style={{ color: colors.ui.text, marginBottom: 8 }}>
                  Daily Nutrition Targets
                </Text>
                <View style={styles.targetsRow}>
                  <View style={styles.targetItem}>
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      Calories
                    </Text>
                    <Text variant="titleMedium" style={{ color: colors.ui.text, fontWeight: '600' }}>
                      {dailyTargets.calories}
                    </Text>
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      kcal
                    </Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      Protein
                    </Text>
                    <Text variant="titleMedium" style={{ color: colors.ui.text, fontWeight: '600' }}>
                      {dailyTargets.protein}g
                    </Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      Fat
                    </Text>
                    <Text variant="titleMedium" style={{ color: colors.ui.text, fontWeight: '600' }}>
                      {dailyTargets.fat}g
                    </Text>
                  </View>
                  <View style={styles.targetItem}>
                    <Text variant="labelSmall" style={{ color: colors.ui.textSecondary }}>
                      Sugar
                    </Text>
                    <Text variant="titleMedium" style={{ color: colors.ui.text, fontWeight: '600' }}>
                      &lt;{dailyTargets.sugar}g
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.ui.border }]}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={[styles.footerButton, { borderColor: colors.ui.outline }]}
              textColor={colors.ui.text}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.footerButton, { backgroundColor: colors.ui.primary }]}
            >
              Save
            </Button>
          </View>
        </View>

        <Modal
          visible={showGenderModal}
          onDismiss={() => setShowGenderModal(false)}
          contentContainerStyle={[styles.genderModal, { backgroundColor: colors.ui.surface }]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.ui.text }]}>
            Select Gender
          </Text>
          <View style={styles.genderOptions}>
            <Button
              mode={bodyData.gender === 'male' ? 'contained' : 'outlined'}
              onPress={() => {
                setBodyData({ ...bodyData, gender: 'male' });
                setShowGenderModal(false);
              }}
              style={[
                styles.genderOption,
                { backgroundColor: bodyData.gender === 'male' ? colors.ui.primary : 'transparent' },
              ]}
              textColor={bodyData.gender === 'male' ? '#FFFFFF' : colors.ui.text}
            >
              Male
            </Button>
            <Button
              mode={bodyData.gender === 'female' ? 'contained' : 'outlined'}
              onPress={() => {
                setBodyData({ ...bodyData, gender: 'female' });
                setShowGenderModal(false);
              }}
              style={[
                styles.genderOption,
                { backgroundColor: bodyData.gender === 'female' ? colors.ui.primary : 'transparent' },
              ]}
              textColor={bodyData.gender === 'female' ? '#FFFFFF' : colors.ui.text}
            >
              Female
            </Button>
          </View>
        </Modal>

        <Modal
          visible={showAllergenModal}
          onDismiss={() => setShowAllergenModal(false)}
          contentContainerStyle={[styles.allergenModal, { backgroundColor: colors.ui.surface }]}
        >
          <View style={styles.allergenModalHeader}>
            <Text variant="titleLarge" style={{ color: colors.ui.text }}>
              Select Allergens
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowAllergenModal(false)}
              style={{ backgroundColor: colors.ui.primary }}
            >
              Done
            </Button>
          </View>
          <View style={styles.allergenContent}>
            <AllergenSelector selections={allergenSelections} onSelectionsChange={setAllergenSelections} />
          </View>
        </Modal>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: height * 0.85,
    overflow: 'hidden',
  },
  container: {
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: height * 0.6,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    marginBottom: SPACING.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarActions: {
    flexDirection: 'column',
    gap: 4,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  goalChip: {
    marginBottom: SPACING.xs,
  },
  allergenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetsCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  targetItem: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
  genderModal: {
    margin: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderOption: {
    flex: 1,
  },
  allergenModal: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    height: height * 0.75,
    overflow: 'hidden',
  },
  allergenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  allergenContent: {
    flex: 1,
    padding: SPACING.md,
  },
});
