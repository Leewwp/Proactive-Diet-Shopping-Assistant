import { COLORS, DARK_COLORS } from '@/constants';
import { BARCODE_SCAN_TYPES, isBarcodeValid, normalizeBarcode } from '@/services';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, useColorScheme, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive?: boolean;
}

const { width } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(width * 0.76, 300);
const SCAN_COOLDOWN_MS = 1200;

export function BarcodeScanner({ onScan, isActive = true }: BarcodeScannerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const scanCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<{ barcode: string; timestamp: number }>({
    barcode: '',
    timestamp: 0,
  });

  useEffect(() => {
    if (!isActive) {
      setScanned(false);
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (scanCooldownTimerRef.current) {
        clearTimeout(scanCooldownTimerRef.current);
      }
    };
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const normalizedBarcode = normalizeBarcode(data);
    if (!isBarcodeValid(normalizedBarcode)) {
      return;
    }

    const now = Date.now();
    const isDuplicateRecentScan =
      lastScanRef.current.barcode === normalizedBarcode &&
      now - lastScanRef.current.timestamp < SCAN_COOLDOWN_MS;

    if (scanned || isDuplicateRecentScan) {
      return;
    }

    setScanned(true);
    lastScanRef.current = {
      barcode: normalizedBarcode,
      timestamp: now,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onScan(normalizedBarcode);

    if (scanCooldownTimerRef.current) {
      clearTimeout(scanCooldownTimerRef.current);
    }
    scanCooldownTimerRef.current = setTimeout(() => {
      setScanned(false);
    }, SCAN_COOLDOWN_MS);
  };

  if (!permission) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.ui.background }]}>
        <ActivityIndicator size="large" color={colors.ui.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.ui.background }]}>
        <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 16 }}>
          Camera permission is required to scan barcodes.
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={isActive && !scanned ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: [...BARCODE_SCAN_TYPES],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.maskTop} />
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <View style={[styles.scannerFrame, { width: SCANNER_SIZE, height: SCANNER_SIZE }]}>
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.ui.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.ui.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.ui.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.ui.primary }]} />
              {!scanned && <View style={[styles.scanLine, { backgroundColor: colors.ui.primary }]} />}
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <IconButton icon="check-circle" iconColor={colors.ui.success} size={48} />
                </View>
              )}
            </View>
            <View style={styles.maskSide} />
          </View>
          <View style={styles.maskBottom}>
            <Text variant="bodyMedium" style={styles.instruction}>
              Align barcode within the frame
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  maskMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskSide: {
    flex: 1,
    height: SCANNER_SIZE,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  maskBottom: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 20,
  },
  scannerFrame: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 18,
    right: 18,
    height: 2,
    opacity: 0.85,
    borderRadius: 8,
  },
  scannedIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
