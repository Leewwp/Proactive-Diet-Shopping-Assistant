import { COLORS, DARK_COLORS } from '@/constants';
import { getDemoProduct, isAIConfigured } from '@/services/aiProductIdentifier';
import { useLocalProductStore } from '@/stores';
import { Product } from '@/types';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    useColorScheme,
    View
} from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';

interface ObjectDetectorProps {
  onDetect: (product: Product) => void;
  isActive?: boolean;
}

export function ObjectDetector({ onDetect, isActive = true }: ObjectDetectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const { products } = useLocalProductStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const isConfigured = isAIConfigured();

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setIsCameraActive(true);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isLoading) return;

    setIsLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setIsCameraActive(false);

      if (isConfigured) {
        // TODO: Implement real AI identification with photo.base64
        // const result = await identifyProductFromImage(photo.base64);
        // if (result) {
        //   const product = convertAIResultToProduct(result, photo.uri);
        //   onDetect(product);
        // }
      } else {
        const product = await getDemoProduct(products);
        if (product) {
          onDetect(product);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCamera = () => {
    setIsCameraActive(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
        <Card style={styles.card}>
          <Card.Content style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.ui.primary} />
            <Text variant="bodyMedium" style={{ marginTop: 16, textAlign: 'center' }}>
              Analyzing product...
            </Text>
            <Text variant="bodySmall" style={{ color: colors.ui.textSecondary, marginTop: 8 }}>
              This may take a few seconds
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <IconButton
              icon="close"
              iconColor="#FFFFFF"
              onPress={handleCloseCamera}
            />
            <Text variant="titleMedium" style={{ color: '#FFFFFF' }}>
              Position product in frame
            </Text>
            <View style={{ width: 48 }} />
          </View>
          <View style={styles.cameraFooter}>
            <Button
              mode="contained"
              onPress={handleTakePhoto}
              style={styles.captureButton}
              icon="camera"
            >
              Capture
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              AI Product Identification
            </Text>
          </View>

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📷</Text>
          </View>

          <Text variant="bodyMedium" style={[styles.description, { color: colors.ui.textSecondary }]}>
            Snap a photo of any product to identify it and get nutritional information.
          </Text>

          <View style={styles.featureList}>
            <Text variant="titleSmall" style={{ marginBottom: 8 }}>
              Features:
            </Text>
            <View style={styles.featureItem}>
              <Text variant="bodySmall">📷 Snap a photo to identify products</Text>
            </View>
            <View style={styles.featureItem}>
              <Text variant="bodySmall">📊 Instant nutrition analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Text variant="bodySmall">⚠️ Allergen detection alerts</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleOpenCamera}
            disabled={!isActive}
            style={styles.actionButton}
            icon="camera"
          >
            Take Photo
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featureList: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureItem: {
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingBottom: 16,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButton: {
    paddingHorizontal: 32,
  },
});
