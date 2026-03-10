import { GoalSelector } from '@/components';
import { AllergenSelector } from '@/components/profile/AllergenSelector';
import { COLORS, DARK_COLORS, getEmptyAllergenSelections } from '@/constants';
import { createDefaultProfile, useProfileStore } from '@/stores';
import { BodyData, DietGoal, Gender } from '@/types';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { Button, ProgressBar, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = 3;

export function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();

  const { setProfile, completeOnboarding } = useProfileStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<DietGoal[]>([]);
  const [allergenSelections, setAllergenSelections] = useState(getEmptyAllergenSelections());
  const [bodyData, setBodyData] = useState<BodyData>({});

  const progress = (currentStep + 1) / STEPS;

  const handleGoalToggle = (goal: DietGoal) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const profile = createDefaultProfile(name || 'User');
    profile.goals = goals;
    profile.allergenSelections = allergenSelections;
    profile.bodyData = bodyData;
    setProfile(profile);
    completeOnboarding();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              What is your goal?
            </Text>
            <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: colors.ui.textSecondary }]}>
              Select all that apply to personalize your experience
            </Text>
            <GoalSelector
              selectedGoals={goals}
              onGoalToggle={handleGoalToggle}
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Any allergies
            </Text>
            <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: colors.ui.textSecondary }]}>
              We will alert you when scanning products with these allergens
            </Text>
            <View style={styles.allergenContainer}>
              <AllergenSelector
                selections={allergenSelections}
                onSelectionsChange={setAllergenSelections}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              What is your name?
            </Text>
            <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: colors.ui.textSecondary }]}>
              Optional: Add family members later in settings
            </Text>
            <TextInput
              mode="outlined"
              label="Your name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              style={styles.input}
            />
            <View style={styles.optionalSection}>
              <Text variant="labelMedium" style={styles.optionalTitle}>
                Body Information (Optional)
              </Text>
              <Text variant="bodySmall" style={[styles.optionalHint, { color: colors.ui.textSecondary }]}>
                This helps personalize your nutrition recommendations. Leave blank to use default values.
              </Text>
              
              <View style={styles.bodyRow}>
                <TextInput
                  mode="outlined"
                  label="Weight (kg)"
                  keyboardType="numeric"
                  value={bodyData.weight ? String(bodyData.weight) : ''}
                  onChangeText={(text) => setBodyData({ ...bodyData, weight: text ? parseFloat(text) : undefined })}
                  placeholder="e.g., 70"
                  style={styles.bodyInput}
                />
                <TextInput
                  mode="outlined"
                  label="Height (cm)"
                  keyboardType="numeric"
                  value={bodyData.height ? String(bodyData.height) : ''}
                  onChangeText={(text) => setBodyData({ ...bodyData, height: text ? parseFloat(text) : undefined })}
                  placeholder="e.g., 175"
                  style={styles.bodyInput}
                />
              </View>

              <View style={styles.bodyRow}>
                <TextInput
                  mode="outlined"
                  label="Age"
                  keyboardType="numeric"
                  value={bodyData.age ? String(bodyData.age) : ''}
                  onChangeText={(text) => setBodyData({ ...bodyData, age: text ? parseFloat(text) : undefined })}
                  placeholder="e.g., 30"
                  style={styles.bodyInput}
                />
                <View style={styles.bodyInput}>
                  <Text variant="labelSmall" style={styles.genderLabel}>Gender</Text>
                  <SegmentedButtons
                    value={bodyData.gender || 'male'}
                    onValueChange={(value) => setBodyData({ ...bodyData, gender: value as Gender })}
                    buttons={[
                      { value: 'male', label: 'M' },
                      { value: 'female', label: 'F' },
                      { value: 'other', label: 'O' },
                    ]}
                    style={styles.genderButtons}
                  />
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ProgressBar progress={progress} color={colors.ui.primary} style={styles.progressBar} />
        <View style={styles.stepIndicator}>
          <Text variant="labelMedium" style={{ color: colors.ui.textSecondary }}>
            Step {currentStep + 1} of {STEPS}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button mode="text" onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={currentStep === 0 && goals.length === 0}
          style={styles.nextButton}
        >
          {currentStep === STEPS - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    marginBottom: 8,
  },
  stepSubtitle: {
    marginBottom: 24,
  },
  input: {
    marginTop: 16,
  },
  allergenContainer: {
    flex: 1,
    minHeight: 400,
  },
  optionalSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  optionalTitle: {
    marginBottom: 8,
  },
  optionalHint: {
    marginBottom: 16,
    fontSize: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bodyInput: {
    flex: 1,
  },
  genderLabel: {
    marginBottom: 4,
  },
  genderButtons: {
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
});
