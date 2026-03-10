import { COLORS, DARK_COLORS } from '@/constants';
import { AlertLevel } from '@/types';
import { getAlertBackgroundColor, getAlertTextColor, getComplianceColor } from '@/utils';
import React from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

interface AlertCardProps {
  level: AlertLevel;
  title: string;
  message: string;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  visible?: boolean;
}

export function AlertCard({
  level,
  title,
  message,
  onDismiss,
  onAction,
  actionLabel,
  visible = true,
}: AlertCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_COLORS : COLORS;

  const backgroundColor = getAlertBackgroundColor(level);
  const textColor = getAlertTextColor(level);
  const accentColor = getComplianceColor(level);

  if (!visible) return null;

  const isEmergency = level === 'emergency';

  if (isEmergency) {
    return (
      <View style={[styles.emergencyContainer, { backgroundColor: accentColor }]}>
        <View style={styles.emergencyContent}>
          <Text variant="titleLarge" style={styles.emergencyTitle}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={styles.emergencyMessage}>
            {message}
          </Text>
        </View>
        {onDismiss && (
          <IconButton
            icon="close"
            iconColor="white"
            size={24}
            onPress={onDismiss}
          />
        )}
      </View>
    );
  }

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: isDark ? colors.ui.surface : backgroundColor },
      ]}
    >
      <Card.Content style={styles.content}>
        <View style={[styles.indicator, { backgroundColor: accentColor }]} />
        <View style={styles.textContainer}>
          <Text variant="titleSmall" style={{ color: textColor, fontWeight: '600' }}>
            {title}
          </Text>
          <Text variant="bodySmall" style={{ color: textColor }}>
            {message}
          </Text>
        </View>
        {onDismiss && (
          <IconButton
            icon="close"
            iconColor={textColor}
            size={20}
            onPress={onDismiss}
          />
        )}
      </Card.Content>
      {onAction && actionLabel && (
        <Card.Actions>
          <Text
            variant="labelMedium"
            style={{ color: accentColor }}
            onPress={onAction}
          >
            {actionLabel}
          </Text>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  indicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  emergencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    color: 'white',
    fontWeight: '700',
  },
  emergencyMessage: {
    color: 'white',
    opacity: 0.9,
  },
});
