import { COLORS, DARK_COLORS } from '@/constants';
import { LocalProduct, createDefaultNutrition } from '@/types/localProduct';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  Text,
  TextInput,
} from 'react-native-paper';

interface LocalProductEditorProps {
  product?: LocalProduct;
  onSave: (product: LocalProduct) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const NUTRI_SCORE_OPTIONS: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];

const COMMON_ALLERGENS = [
  'milk', 'eggs', 'peanuts', 'tree nuts', 'soy', 'wheat', 'fish', 'shellfish',
  'gluten', 'sesame', 'sulfites', 'corn'
];

const COMMON_CATEGORIES = [
  'snacks', 'beverages', 'dairy', 'meat', 'bakery', 'frozen', 'canned',
  'condiments', 'breakfast', 'desserts', 'fruits', 'vegetables', 'organic'
];

export function LocalProductEditor({
  product,
  onSave,
  onCancel,
  isEditing = false,
}: LocalProductEditorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const [formData, setFormData] = useState<Partial<LocalProduct>>({
    barcode: '',
    name: '',
    brand: '',
    imageUrl: '',
    nutrition: createDefaultNutrition(),
    allergens: [],
    categories: [],
    nutriScore: undefined,
    ingredients: [],
    servingSize: '',
    quantity: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAllergen, setNewAllergen] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newIngredient, setNewIngredient] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        nutrition: product.nutrition || createDefaultNutrition(),
      });
    }
  }, [product]);

  const updateField = (field: keyof LocalProduct, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNutrition = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      nutrition: {
        ...prev.nutrition!,
        [field]: numValue,
      },
    }));
  };

  const addAllergen = (allergen: string) => {
    if (allergen.trim() && !formData.allergens?.includes(allergen.trim())) {
      updateField('allergens', [...(formData.allergens || []), allergen.trim()]);
    }
    setNewAllergen('');
  };

  const removeAllergen = (allergen: string) => {
    updateField(
      'allergens',
      formData.allergens?.filter((a) => a !== allergen) || []
    );
  };

  const addCategory = (category: string) => {
    if (category.trim() && !formData.categories?.includes(category.trim())) {
      updateField('categories', [...(formData.categories || []), category.trim()]);
    }
    setNewCategory('');
  };

  const removeCategory = (category: string) => {
    updateField(
      'categories',
      formData.categories?.filter((c) => c !== category) || []
    );
  };

  const addIngredient = (ingredient: string) => {
    if (ingredient.trim() && !formData.ingredients?.includes(ingredient.trim())) {
      updateField('ingredients', [...(formData.ingredients || []), ingredient.trim()]);
    }
    setNewIngredient('');
  };

  const removeIngredient = (ingredient: string) => {
    updateField(
      'ingredients',
      formData.ingredients?.filter((i) => i !== ingredient) || []
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.barcode?.trim()) {
      newErrors.barcode = 'Barcode is required';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const savedProduct: LocalProduct = {
      barcode: formData.barcode!,
      name: formData.name!,
      brand: formData.brand,
      imageUrl: formData.imageUrl,
      nutrition: formData.nutrition!,
      allergens: formData.allergens || [],
      categories: formData.categories || [],
      nutriScore: formData.nutriScore,
      ingredients: formData.ingredients,
      servingSize: formData.servingSize,
      quantity: formData.quantity,
      createdAt: product?.createdAt || now,
      updatedAt: now,
    };

    onSave(savedProduct);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.ui.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={[styles.section, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <TextInput
            mode="outlined"
            label="Barcode *"
            value={formData.barcode}
            onChangeText={(value) => updateField('barcode', value)}
            error={!!errors.barcode}
            disabled={isEditing}
            style={styles.input}
          />
          {errors.barcode && (
            <Text variant="bodySmall" style={{ color: colors.ui.error }}>
              {errors.barcode}
            </Text>
          )}

          <TextInput
            mode="outlined"
            label="Product Name *"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            error={!!errors.name}
            style={styles.input}
          />
          {errors.name && (
            <Text variant="bodySmall" style={{ color: colors.ui.error }}>
              {errors.name}
            </Text>
          )}

          <TextInput
            mode="outlined"
            label="Brand"
            value={formData.brand}
            onChangeText={(value) => updateField('brand', value)}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Image URL"
            value={formData.imageUrl}
            onChangeText={(value) => updateField('imageUrl', value)}
            style={styles.input}
            placeholder="https://example.com/image.jpg"
          />

          <TextInput
            mode="outlined"
            label="Serving Size"
            value={formData.servingSize}
            onChangeText={(value) => updateField('servingSize', value)}
            style={styles.input}
            placeholder="e.g., 100g, 1 cup"
          />

          <TextInput
            mode="outlined"
            label="Quantity"
            value={formData.quantity}
            onChangeText={(value) => updateField('quantity', value)}
            style={styles.input}
            placeholder="e.g., 500g, 1L"
          />

          <Text variant="labelMedium" style={styles.label}>
            Nutri-Score
          </Text>
          <View style={styles.chipRow}>
            {NUTRI_SCORE_OPTIONS.map((score) => (
              <Chip
                key={score}
                selected={formData.nutriScore === score}
                onPress={() => updateField('nutriScore', formData.nutriScore === score ? undefined : score)}
                style={[
                  styles.scoreChip,
                  formData.nutriScore === score && { backgroundColor: colors.nutriScore[score] },
                ]}
                textStyle={formData.nutriScore === score ? { color: '#fff' } : undefined}
              >
                {score}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.section, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Nutrition (per 100g)
          </Text>

          <View style={styles.nutritionRow}>
            <TextInput
              mode="outlined"
              label="Calories (kcal)"
              value={formData.nutrition?.calories?.toString() || '0'}
              onChangeText={(value) => updateNutrition('calories', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
            <TextInput
              mode="outlined"
              label="Protein (g)"
              value={formData.nutrition?.protein?.toString() || '0'}
              onChangeText={(value) => updateNutrition('protein', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
          </View>

          <View style={styles.nutritionRow}>
            <TextInput
              mode="outlined"
              label="Sugar (g)"
              value={formData.nutrition?.sugar?.toString() || '0'}
              onChangeText={(value) => updateNutrition('sugar', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
            <TextInput
              mode="outlined"
              label="Fat (g)"
              value={formData.nutrition?.fat?.toString() || '0'}
              onChangeText={(value) => updateNutrition('fat', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
          </View>

          <View style={styles.nutritionRow}>
            <TextInput
              mode="outlined"
              label="Saturated Fat (g)"
              value={formData.nutrition?.saturatedFat?.toString() || '0'}
              onChangeText={(value) => updateNutrition('saturatedFat', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
            <TextInput
              mode="outlined"
              label="Sodium (mg)"
              value={formData.nutrition?.sodium?.toString() || '0'}
              onChangeText={(value) => updateNutrition('sodium', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
          </View>

          <View style={styles.nutritionRow}>
            <TextInput
              mode="outlined"
              label="Fiber (g)"
              value={formData.nutrition?.fiber?.toString() || '0'}
              onChangeText={(value) => updateNutrition('fiber', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
            <TextInput
              mode="outlined"
              label="Carbs (g)"
              value={formData.nutrition?.carbohydrates?.toString() || '0'}
              onChangeText={(value) => updateNutrition('carbohydrates', value)}
              keyboardType="numeric"
              style={styles.nutritionInput}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.section, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Allergens
          </Text>

          <View style={styles.chipRow}>
            {formData.allergens?.map((allergen) => (
              <Chip
                key={allergen}
                onClose={() => removeAllergen(allergen)}
                style={styles.allergenChip}
              >
                {allergen}
              </Chip>
            ))}
          </View>

          <Text variant="labelSmall" style={styles.label}>
            Quick Add:
          </Text>
          <View style={styles.chipRow}>
            {COMMON_ALLERGENS.filter((a) => !formData.allergens?.includes(a)).slice(0, 6).map((allergen) => (
              <Chip
                key={allergen}
                onPress={() => addAllergen(allergen)}
                style={styles.quickAddChip}
                compact
              >
                + {allergen}
              </Chip>
            ))}
          </View>

          <TextInput
            mode="outlined"
            label="Add Allergen"
            value={newAllergen}
            onChangeText={setNewAllergen}
            onSubmitEditing={() => addAllergen(newAllergen)}
            right={<TextInput.Icon icon="plus" onPress={() => addAllergen(newAllergen)} />}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.section, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Categories
          </Text>

          <View style={styles.chipRow}>
            {formData.categories?.map((category) => (
              <Chip
                key={category}
                onClose={() => removeCategory(category)}
                style={styles.categoryChip}
              >
                {category}
              </Chip>
            ))}
          </View>

          <Text variant="labelSmall" style={styles.label}>
            Quick Add:
          </Text>
          <View style={styles.chipRow}>
            {COMMON_CATEGORIES.filter((c) => !formData.categories?.includes(c)).slice(0, 6).map((category) => (
              <Chip
                key={category}
                onPress={() => addCategory(category)}
                style={styles.quickAddChip}
                compact
              >
                + {category}
              </Chip>
            ))}
          </View>

          <TextInput
            mode="outlined"
            label="Add Category"
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={() => addCategory(newCategory)}
            right={<TextInput.Icon icon="plus" onPress={() => addCategory(newCategory)} />}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.section, { backgroundColor: colors.ui.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ingredients
          </Text>

          <View style={styles.chipRow}>
            {formData.ingredients?.map((ingredient) => (
              <Chip
                key={ingredient}
                onClose={() => removeIngredient(ingredient)}
                style={styles.ingredientChip}
              >
                {ingredient}
              </Chip>
            ))}
          </View>

          <TextInput
            mode="outlined"
            label="Add Ingredient"
            value={newIngredient}
            onChangeText={setNewIngredient}
            onSubmitEditing={() => addIngredient(newIngredient)}
            right={<TextInput.Icon icon="plus" onPress={() => addIngredient(newIngredient)} />}
            style={styles.input}
            placeholder="Enter ingredients one by one"
          />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.actionButton}
        >
          {isEditing ? 'Update' : 'Save'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionInput: {
    flex: 1,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  scoreChip: {
    marginRight: 4,
  },
  allergenChip: {
    backgroundColor: '#FEF3C7',
  },
  categoryChip: {
    backgroundColor: '#DBEAFE',
  },
  ingredientChip: {
    backgroundColor: '#E0E7FF',
  },
  quickAddChip: {
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});
