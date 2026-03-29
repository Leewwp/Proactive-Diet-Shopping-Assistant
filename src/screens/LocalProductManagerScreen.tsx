import { LocalProductEditor } from '@/components/local-product';
import { COLORS, DARK_COLORS } from '@/constants';
import { LocalProduct, createDefaultNutrition } from '@/types/localProduct';
import { generateLocalBarcode } from '@/services/localProductService';
import { useLocalProductStore } from '@/stores';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  FAB,
  IconButton,
  Text,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LocalProductManagerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useLocalProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | undefined>();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const filteredProducts = searchQuery
    ? products.filter(
        (p: LocalProduct) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : products;

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowEditor(true);
  };

  const handleEditProduct = (product: LocalProduct) => {
    setEditingProduct(product);
    setShowEditor(true);
  };

  const handleDeleteProduct = (product: LocalProduct) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product.barcode),
        },
      ]
    );
  };

  const handleSaveProduct = useCallback(
    (product: LocalProduct) => {
      addProduct(product);
      setShowEditor(false);
      setEditingProduct(undefined);
    },
    [addProduct]
  );

  const handleExport = async () => {
    try {
      const json = JSON.stringify(products, null, 2);
      await Share.share({
        message: json,
        title: 'Local Products Export',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export products');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Error', 'Please paste JSON data');
      return;
    }

    try {
      const importData = JSON.parse(importText);
      const items = Array.isArray(importData) ? importData : [importData];
      let imported = 0;

      items.forEach((item: any) => {
        if (item.barcode && item.name) {
          const product: LocalProduct = {
            barcode: item.barcode,
            name: item.name,
            brand: item.brand,
            imageUrl: item.imageUrl,
            nutrition: {
              ...createDefaultNutrition(),
              ...(item.nutrition || {}),
            },
            allergens: item.allergens || [],
            categories: item.categories || [],
            nutriScore: item.nutriScore,
            ingredients: item.ingredients || [],
            servingSize: item.servingSize,
            quantity: item.quantity,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addProduct(product);
          imported++;
        }
      });

      setShowImportModal(false);
      setImportText('');
      Alert.alert('Import Complete', `${imported} product(s) imported`);
    } catch (error) {
      Alert.alert('Import Failed', 'Invalid JSON format');
    }
  };

  const renderProduct = ({ item }: { item: LocalProduct }) => (
    <Card
      style={[styles.productCard, { backgroundColor: colors.ui.surface }]}
      onPress={() => handleEditProduct(item)}
    >
      <Card.Content>
        <View style={styles.productRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.ui.outlineVariant }]}>
              <Text variant="labelSmall">No Image</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.name}
            </Text>
            {item.brand && (
              <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                {item.brand}
              </Text>
            )}
            <Text variant="labelSmall" style={{ color: colors.ui.textSecondary, marginTop: 4 }}>
              {item.barcode}
            </Text>
            {item.nutriScore && (
              <View
                style={[
                  styles.nutriScoreBadge,
                  { backgroundColor: colors.nutriScore[item.nutriScore] },
                ]}
              >
                <Text variant="labelSmall" style={styles.nutriScoreText}>
                  {item.nutriScore}
                </Text>
              </View>
            )}
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDeleteProduct(item)}
          />
        </View>
        {item.allergens.length > 0 && (
          <View style={styles.chipRow}>
            {item.allergens.slice(0, 4).map((allergen) => (
              <Chip key={allergen} mode="outlined" compact style={styles.allergenChip}>
                {allergen}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={{ color: colors.ui.textSecondary }}>
        No Local Products
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.ui.textSecondary, textAlign: 'center', marginTop: 8 }}>
        Add products manually or import from JSON to use them during barcode scanning.
      </Text>
      <Button
        mode="contained"
        onPress={handleAddProduct}
        style={{ marginTop: 24 }}
        icon="plus"
      >
        Add Product
      </Button>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconButton icon="arrow-left" size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall">Local Products</Text>
            <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
              {products.length} product{products.length !== 1 ? 's' : ''} configured
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.ui.surface, color: colors.ui.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.ui.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            onPress={() => setShowImportModal(true)}
            icon="import"
            compact
          >
            Import
          </Button>
          <Button
            mode="outlined"
            onPress={handleExport}
            icon="export"
            disabled={products.length === 0}
            compact
          >
            Export
          </Button>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ui.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.barcode}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={handleAddProduct}
      />

      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.ui.background }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <IconButton
              icon="close"
              onPress={() => {
                setShowEditor(false);
                setEditingProduct(undefined);
              }}
            />
          </View>
          <LocalProductEditor
            product={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => {
              setShowEditor(false);
              setEditingProduct(undefined);
            }}
            isEditing={!!editingProduct}
          />
        </View>
      </Modal>

      <Modal
        visible={showImportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.ui.background }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">Import Products</Text>
            <IconButton
              icon="close"
              onPress={() => {
                setShowImportModal(false);
                setImportText('');
              }}
            />
          </View>
          <ScrollView style={styles.importContent} contentContainerStyle={styles.importContentContainer}>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Paste JSON data below. The format should be an array of products with at least barcode and name fields.
            </Text>
            <TextInput
              style={[
                styles.importInput,
                { backgroundColor: colors.ui.surface, color: colors.ui.text },
              ]}
              placeholder={`[
  {
    "barcode": "6901234567890",
    "name": "Example Product",
    "brand": "Brand Name",
    "nutrition": {
      "calories": 100,
      "sugar": 5
    },
    "allergens": ["milk", "soy"]
  }
]`}
              placeholderTextColor={colors.ui.textSecondary}
              value={importText}
              onChangeText={setImportText}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.importActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                style={styles.importButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleImport}
                style={styles.importButton}
              >
                Import
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  searchRow: {
    marginTop: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nutriScoreBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  nutriScoreText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  allergenChip: {
    height: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  importContent: {
    flex: 1,
  },
  importContentContainer: {
    padding: 16,
  },
  importInput: {
    minHeight: 300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  importActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  importButton: {
    flex: 1,
  },
});
