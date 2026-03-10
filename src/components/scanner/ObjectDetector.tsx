import { COLORS, DARK_COLORS } from '@/constants';
import {
  convertAIResultToProduct,
  getAIProviderName,
  identifyProductFromImage,
  isAIConfigured,
} from '@/services/aiProductIdentifier';
import { Product } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, useColorScheme, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text } from 'react-native-paper';

interface ObjectDetectorProps {
  onDetect: (product: Product) => void;
  isActive?: boolean;
}

export function ObjectDetector({ onDetect, isActive = true }: ObjectDetectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          await processImage(asset.base64, asset.uri);
        }
      }
    } catch (err) {
      setError('Failed to pick image');
      console.error(err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          await processImage(asset.base64, asset.uri);
        }
      }
    } catch (err) {
      setError('Failed to take photo');
      console.error(err);
    }
  };

  const processImage = async (base64: string, imageUri: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await identifyProductFromImage(base64);

      if (result) {
        if (result.confidence < 0.3) {
          setError('Could not confidently identify the product. Please try a clearer image.');
          return;
        }

        const product = convertAIResultToProduct(result, imageUri);
        onDetect(product);
      } else {
        if (!isAIConfigured()) {
          setError('AI is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in the project environment.');
        } else {
          setError('Failed to identify product. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during identification');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.ui.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={{ textAlign: 'center' }}>
              AI Product Identification
            </Text>
            <Chip mode="outlined" compact style={{ marginTop: 8 }} textStyle={{ fontSize: 10 }}>
              {getAIProviderName()}
            </Chip>
          </View>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
            </View>
          )}

          {isProcessing && (
            <View style={styles.processing}>
              <ActivityIndicator size="large" color={colors.ui.primary} />
              <Text variant="bodySmall" style={{ marginTop: 8 }}>
                Analyzing product with AI...
              </Text>
              <Text variant="labelSmall" style={{ marginTop: 4, opacity: 0.7 }}>
                This may take a few seconds
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text variant="bodyMedium" style={{ color: colors.ui.error, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          )}

          {!isAIConfigured() && (
            <Text variant="bodySmall" style={[styles.configHint, { color: colors.ui.textSecondary }]}>
              Configure EXPO_PUBLIC_OPENAI_API_KEY in project environment to enable identify.
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={takePhoto}
              disabled={!isActive || isProcessing}
              style={styles.actionButton}
            >
              Take Photo
            </Button>

            <Button
              mode="outlined"
              onPress={pickImage}
              disabled={!isActive || isProcessing}
              style={styles.actionButton}
            >
              Choose Image
            </Button>
          </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  processing: {
    alignItems: 'center',
    marginVertical: 24,
  },
  errorContainer: {
    padding: 12,
    marginVertical: 8,
  },
  configHint: {
    textAlign: 'center',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
