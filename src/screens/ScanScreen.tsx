import { AlertCard, BarcodeScanner, ObjectDetector, ProductCard } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import {
    convertLocalProductToProduct,
    fetchProductByBarcode,
    getBarcodeType,
    isBarcodeValid,
    normalizeBarcode,
    searchProducts,
} from '@/services';
import { useCartStore, useLocalProductStore, useProductStore, useProfileStore } from '@/stores';
import { AlertInfo, Product } from '@/types';
import { determineAlertLevel } from '@/utils';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useColorScheme,
    View
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    IconButton,
    Portal,
    SegmentedButtons,
    Text,
    TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScanMode = 'barcode' | 'identify';

export function ScanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ compare?: string; slot?: string }>();

  const isCompareMode = params.compare === 'true';
  const compareSlot = params.slot || 'A';

  const { profile } = useProfileStore();
  const { addRecentScan, getCachedProduct, recentScans, isLoading, setLoading, addToComparison, comparisonProducts } = useProductStore();
  const { getProductByBarcode, searchProducts: searchLocalProducts } = useLocalProductStore();
  const { addItem } = useCartStore();

  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setLocalError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  useEffect(() => {
    setLoading(false);
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  const handleProductFound = useCallback((product: Product) => {
    addRecentScan(product);
    
    if (isCompareMode) {
      addToComparison(product);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.replace('/compare');
      return;
    }
    
    setScannedProduct(product);
  }, [addRecentScan, addToComparison, isCompareMode, router]);

  const handleBarcodeScan = useCallback(
    async (rawBarcode: string) => {
      const cleanRawBarcode = rawBarcode.trim();
      
      const localProductRaw = getProductByBarcode(cleanRawBarcode);
      if (localProductRaw) {
        const product = convertLocalProductToProduct(localProductRaw);
        handleProductFound(product);
        return;
      }

      const barcode = normalizeBarcode(cleanRawBarcode);
      if (!isBarcodeValid(barcode)) {
        setLocalError('Invalid barcode format. Please scan an EAN/UPC product code.');
        return;
      }

      setLoading(true);
      setLocalError(null);

      const barcodeType = getBarcodeType(barcode);

      try {
        const localProduct = getProductByBarcode(barcode);
        if (localProduct) {
          const product = convertLocalProductToProduct(localProduct);
          handleProductFound(product);
          return;
        }

        const cachedProduct = getCachedProduct(barcode);
        if (cachedProduct) {
          handleProductFound(cachedProduct);
          return;
        }

        const product = await fetchProductByBarcode(barcode);
        if (product) {
          handleProductFound(product);
        } else {
          setLocalError(
            `Product not found in current databases.\n\nBarcode: ${barcode}\nRegion: ${barcodeType}\n\nTry:\n- Search by product name\n- Enter barcode manually\n- Add to local products`
          );
        }
      } catch {
        setLocalError('Failed to fetch product. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    },
    [getCachedProduct, getProductByBarcode, handleProductFound, setLoading]
  );

  const handleManualSearch = useCallback(async () => {
    if (!manualBarcode.trim()) {
      return;
    }

    await handleBarcodeScan(manualBarcode.trim());
    setManualBarcode('');
    setShowManualInput(false);
  }, [handleBarcodeScan, manualBarcode]);

  const handleProductNameSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setLocalError(null);

    try {
      const localResults = searchLocalProducts(searchQuery.trim());
      const localProducts = localResults.map(convertLocalProductToProduct);
      
      const remoteResults = await searchProducts(searchQuery.trim());
      
      const allResults = [...localProducts];
      const localBarcodes = new Set(localProducts.map((p: Product) => p.barcode));
      for (const product of remoteResults) {
        if (!localBarcodes.has(product.barcode)) {
          allResults.push(product);
        }
      }
      
      setSearchResults(allResults);

      if (allResults.length === 0) {
        setLocalError('No products found. Try a different search term.');
      }
    } catch {
      setLocalError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchLocalProducts]);

  const handleObjectDetect = useCallback(
    (product: Product) => {
      handleProductFound(product);
    },
    [handleProductFound]
  );

  const handleProductPress = useCallback(() => {
    if (scannedProduct) {
      router.push(`/product/${scannedProduct.barcode}` as const);
    }
  }, [router, scannedProduct]);

  const handleAddToCart = useCallback(() => {
    if (!scannedProduct || !profile) {
      return;
    }

    const alert = determineAlertLevel(scannedProduct, profile);
    setAlertInfo(alert);

    if (alert.level !== 'compliant') {
      setShowConfirmDialog(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    } else {
      performAddToCart();
    }
  }, [profile, scannedProduct]);

  const performAddToCart = useCallback(() => {
    if (!scannedProduct) return;
    
    addItem(scannedProduct);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setShowConfirmDialog(false);
    setScannedProduct(null);
    setAlertInfo(null);
  }, [addItem, scannedProduct]);

  const handleDismiss = useCallback(() => {
    setScannedProduct(null);
    setLocalError(null);
    setSearchResults([]);
    setSearchQuery('');
    setAlertInfo(null);
    setShowConfirmDialog(false);
  }, []);

  const closeErrorDialog = useCallback(() => {
    setLocalError(null);
  }, []);

  const handleSelectSearchResult = useCallback(
    (product: Product) => {
      handleProductFound(product);
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
    },
    [handleProductFound]
  );

  const handleGoToLocalProducts = useCallback(() => {
    router.push('/local-products' as any);
  }, [router]);

  const handleRecentProductPress = useCallback((product: Product) => {
    if (isCompareMode) {
      addToComparison(product);
      router.back();
    } else {
      router.push(`/product/${product.barcode}` as const);
    }
  }, [isCompareMode, addToComparison, router]);

  const alertLevel =
    scannedProduct && profile ? determineAlertLevel(scannedProduct, profile).level : 'compliant';
  const isErrorDialogVisible = Boolean(error) && searchResults.length === 0;

  const getTitle = () => {
    if (isCompareMode) {
      return `Scan Product ${compareSlot}`;
    }
    return 'Scan Product';
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.ui.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Card style={[styles.headerCard, { backgroundColor: colors.ui.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.titleBlock}>
                <Text variant="headlineSmall">{getTitle()}</Text>
                {isCompareMode && (
                  <Text variant="bodySmall" style={{ color: colors.ui.primary }}>
                    Select a product to compare
                  </Text>
                )}
                {!isCompareMode && (
                  <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                    Faster lookup with region-aware barcode matching
                  </Text>
                )}
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="database"
                  mode="outlined"
                  size={20}
                  onPress={handleGoToLocalProducts}
                />
                <IconButton
                  icon="keyboard"
                  mode="outlined"
                  size={20}
                  onPress={() => {
                    setShowManualInput(!showManualInput);
                    setShowSearch(false);
                  }}
                />
                <IconButton
                  icon="magnify"
                  mode="outlined"
                  size={20}
                  onPress={() => {
                    setShowSearch(!showSearch);
                    setShowManualInput(false);
                  }}
                />
              </View>
            </View>
            <SegmentedButtons
              value={scanMode}
              onValueChange={(value) => {
                if (isErrorDialogVisible) {
                  return;
                }
                setScanMode(value as ScanMode);
              }}
              buttons={[
                { value: 'barcode', label: 'Barcode', icon: 'barcode-scan', disabled: isErrorDialogVisible },
                { value: 'identify', label: 'Identify', icon: 'camera', disabled: isErrorDialogVisible },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>
      </View>

      {showManualInput && (
        <Card style={[styles.inputCard, { backgroundColor: colors.ui.surface }]}>
          <Card.Content>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Enter Barcode Manually
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                mode="outlined"
                placeholder="Enter barcode (8-14 digits)"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="numeric"
                style={styles.textInput}
                onSubmitEditing={handleManualSearch}
              />
              <Button mode="contained" onPress={handleManualSearch} disabled={!manualBarcode.trim()}>
                Search
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {showSearch && (
        <Card style={[styles.inputCard, { backgroundColor: colors.ui.surface }]}>
          <Card.Content>
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Search by Product Name
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                mode="outlined"
                placeholder="Enter product name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.textInput}
                onSubmitEditing={handleProductNameSearch}
              />
              <Button
                mode="contained"
                onPress={handleProductNameSearch}
                disabled={!searchQuery.trim() || isSearching}
                loading={isSearching}
              >
                Search
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.scannerContainer}>
        {scanMode === 'barcode' ? (
          <BarcodeScanner
            onScan={handleBarcodeScan}
            isActive={!scannedProduct && !showManualInput && !showSearch && !isErrorDialogVisible}
          />
        ) : (
          <ObjectDetector onDetect={handleObjectDetect} isActive={isCompareMode || (!scannedProduct && !isErrorDialogVisible)} />
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Looking up product...
          </Text>
        </View>
      )}

      {isErrorDialogVisible && (
        <View style={styles.errorBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeErrorDialog} />
          <Card style={[styles.errorCard, { backgroundColor: colors.ui.surface }]}>
            <Card.Content>
              <View style={styles.errorHeader}>
                <Text variant="titleMedium">Product Not Found</Text>
                <IconButton icon="close" size={18} onPress={closeErrorDialog} />
              </View>
              <Text variant="bodyMedium" style={{ color: colors.ui.error, textAlign: 'left' }}>
                {error}
              </Text>
              <View style={styles.errorActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    closeErrorDialog();
                    setShowManualInput(true);
                    setShowSearch(false);
                  }}
                  style={styles.errorButton}
                >
                  Enter Barcode
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    closeErrorDialog();
                    setShowSearch(true);
                    setShowManualInput(false);
                  }}
                  style={styles.errorButton}
                >
                  Search Name
                </Button>
              </View>
              <Button
                mode="contained"
                onPress={() => {
                  closeErrorDialog();
                  handleGoToLocalProducts();
                }}
                icon="database"
                style={{ marginTop: 12 }}
              >
                Add to Local Products
              </Button>
              <Button mode="outlined" onPress={handleDismiss} style={{ marginTop: 8 }}>
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}

      {searchResults.length > 0 && (
        <View
          style={[
            styles.searchResultsSheet,
            {
              backgroundColor: colors.ui.surface,
              paddingBottom: insets.bottom + 16,
              borderTopColor: colors.ui.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.ui.outlineVariant }]} />
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Search Results ({searchResults.length})
          </Text>
          <ScrollView style={styles.searchResultsList}>
            {searchResults.map((product) => (
              <ProductCard
                key={product.barcode}
                product={product}
                compact
                onPress={() => handleSelectSearchResult(product)}
              />
            ))}
          </ScrollView>
          <Button mode="outlined" onPress={handleDismiss} style={{ marginTop: 12 }}>
            Clear Results
          </Button>
        </View>
      )}

      {scannedProduct && !isLoading && !isCompareMode && (
        <View
          style={[
            styles.productSheet,
            {
              backgroundColor: colors.ui.surface,
              paddingBottom: insets.bottom + 16,
              borderTopColor: colors.ui.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.ui.outlineVariant }]} />
          <ProductCard product={scannedProduct} alertLevel={alertLevel} onPress={handleProductPress} />
          {alertInfo && alertInfo.level !== 'compliant' && (
            <View style={styles.alertContainer}>
              <AlertCard
                level={alertInfo.level}
                title={alertInfo.level === 'emergency' ? 'Warning' : alertInfo.level === 'suggestion' ? 'Caution' : 'Tip'}
                message={alertInfo.message}
                visible={true}
              />
            </View>
          )}
          <View style={styles.productActions}>
            <Button mode="outlined" onPress={handleDismiss} style={styles.actionButton}>
              Scan Another
            </Button>
            <Button mode="contained" onPress={handleAddToCart} style={styles.actionButton}>
              Add to Cart
            </Button>
          </View>
        </View>
      )}

      <Portal>
        {showConfirmDialog && alertInfo && (
          <View style={styles.confirmDialogOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowConfirmDialog(false)} />
            <Card style={[styles.confirmDialog, { backgroundColor: colors.ui.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                  {alertInfo.level === 'emergency' ? '⚠️ Allergen Warning' : 'Add to Cart?'}
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                  {alertInfo.message}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.ui.textSecondary, marginBottom: 16 }}>
                  Product: {scannedProduct?.name}
                </Text>
                <View style={styles.confirmActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowConfirmDialog(false)}
                    style={styles.confirmButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowConfirmDialog(false);
                      router.push(`/product/${scannedProduct?.barcode}` as const);
                    }}
                    style={styles.confirmButton}
                  >
                    View Details
                  </Button>
                </View>
                <Button
                  mode="contained"
                  onPress={performAddToCart}
                  style={{ marginTop: 8 }}
                >
                  Add Anyway
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  headerCard: {
    borderRadius: 18,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    paddingRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  segmentedButtons: {
    marginTop: 12,
  },
  inputCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 19, 38, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
  },
  errorCard: {
    width: '92%',
    maxWidth: 460,
    borderRadius: 14,
    zIndex: 2,
  },
  errorBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 16, 34, 0.45)',
    zIndex: 30,
    paddingHorizontal: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  errorButton: {
    flex: 1,
  },
  productSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 16,
    maxHeight: '72%',
  },
  alertContainer: {
    marginTop: 12,
  },
  searchResultsSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 16,
    maxHeight: '72%',
  },
  searchResultsList: {
    maxHeight: 300,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  confirmDialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 16, 34, 0.6)',
    zIndex: 100,
    padding: 16,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
  },
});
