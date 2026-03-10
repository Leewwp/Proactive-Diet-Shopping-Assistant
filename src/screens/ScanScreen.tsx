import { BarcodeScanner, ObjectDetector, ProductCard } from '@/components';
import { COLORS, DARK_COLORS } from '@/constants';
import {
  fetchProductByBarcode,
  getBarcodeType,
  isBarcodeValid,
  normalizeBarcode,
  searchProducts,
} from '@/services';
import { useProductStore, useProfileStore } from '@/stores';
import { Product } from '@/types';
import { determineAlertLevel } from '@/utils';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  IconButton,
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

  const { profile } = useProfileStore();
  const { addRecentScan, getCachedProduct, recentScans, isLoading, setLoading } = useProductStore();

  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [error, setLocalError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setLoading(false);
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  const handleBarcodeScan = useCallback(
    async (rawBarcode: string) => {
      const barcode = normalizeBarcode(rawBarcode);
      if (!isBarcodeValid(barcode)) {
        setLocalError('Invalid barcode format. Please scan an EAN/UPC product code.');
        return;
      }

      setLoading(true);
      setLocalError(null);

      const barcodeType = getBarcodeType(barcode);

      try {
        const cachedProduct = getCachedProduct(barcode);
        if (cachedProduct) {
          addRecentScan(cachedProduct);
          setScannedProduct(cachedProduct);
          return;
        }

        const product = await fetchProductByBarcode(barcode);
        if (product) {
          addRecentScan(product);
          setScannedProduct(product);
        } else {
          setLocalError(
            `Product not found in current databases.\n\nBarcode: ${barcode}\nRegion: ${barcodeType}\n\nTry:\n- Search by product name\n- Enter barcode manually`
          );
        }
      } catch {
        setLocalError('Failed to fetch product. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    },
    [addRecentScan, getCachedProduct, setLoading]
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
      const results = await searchProducts(searchQuery.trim());
      setSearchResults(results);

      if (results.length === 0) {
        setLocalError('No products found. Try a different search term.');
      }
    } catch {
      setLocalError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleObjectDetect = useCallback(
    (product: Product) => {
      addRecentScan(product);
      setScannedProduct(product);
    },
    [addRecentScan]
  );

  const handleProductPress = useCallback(() => {
    if (scannedProduct) {
      router.push(`/product/${scannedProduct.barcode}` as const);
    }
  }, [router, scannedProduct]);

  const handleAddToCart = useCallback(() => {
    if (scannedProduct) {
      router.push({
        pathname: '/product/[barcode]' as const,
        params: { barcode: scannedProduct.barcode, addToCart: 'true' },
      });
    }
  }, [router, scannedProduct]);

  const handleDismiss = useCallback(() => {
    setScannedProduct(null);
    setLocalError(null);
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  const closeErrorDialog = useCallback(() => {
    setLocalError(null);
  }, []);

  const handleSelectSearchResult = useCallback(
    (product: Product) => {
      addRecentScan(product);
      setScannedProduct(product);
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
    },
    [addRecentScan]
  );

  const alertLevel =
    scannedProduct && profile ? determineAlertLevel(scannedProduct, profile).level : 'compliant';
  const isErrorDialogVisible = Boolean(error) && searchResults.length === 0;

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
                <Text variant="headlineSmall">Scan Product</Text>
                <Text variant="bodySmall" style={{ color: colors.ui.textSecondary }}>
                  Faster lookup with region-aware barcode matching
                </Text>
              </View>
              <View style={styles.headerActions}>
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
          <ObjectDetector onDetect={handleObjectDetect} isActive={!scannedProduct && !isErrorDialogVisible} />
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
              <Button mode="contained" onPress={handleDismiss} style={{ marginTop: 12 }}>
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

      {scannedProduct && !isLoading && (
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

      {recentScans.length > 0 && !scannedProduct && !searchResults.length && (
        <View
          style={[
            styles.recentScans,
            {
              backgroundColor: isDark ? 'rgba(18, 28, 45, 0.92)' : 'rgba(244, 248, 255, 0.96)',
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <Text variant="labelMedium" style={[styles.recentTitle, { color: colors.ui.text }]}>
            Recent Scans
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentScans.slice(0, 5).map((product) => (
              <View key={product.barcode} style={styles.recentItem}>
                <ProductCard
                  product={product}
                  compact
                  onPress={() => router.push(`/product/${product.barcode}` as const)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
    maxHeight: '62%',
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
  recentScans: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  recentTitle: {
    marginBottom: 12,
  },
  recentItem: {
    marginRight: 12,
    width: 168,
  },
});
