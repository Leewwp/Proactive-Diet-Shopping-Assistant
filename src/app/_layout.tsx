import { COLORS, DARK_COLORS } from '@/constants';
import { OnboardingScreen } from '@/screens';
import { useProfileStore } from '@/stores';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Icon, MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.ui.primary,
    secondary: COLORS.ui.secondary,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: DARK_COLORS.ui.primary,
    secondary: DARK_COLORS.ui.secondary,
    background: DARK_COLORS.ui.background,
    surface: DARK_COLORS.ui.surface,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isOnboarded } = useProfileStore();
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);

  if (!fontsLoaded && !fontError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator
            size="small"
            color={colorScheme === 'dark' ? DARK_COLORS.ui.primary : COLORS.ui.primary}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!isOnboarded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
          <OnboardingScreen />
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colorScheme === 'dark' ? DARK_COLORS.ui.primary : COLORS.ui.primary,
            tabBarInactiveTintColor: colorScheme === 'dark' ? DARK_COLORS.ui.textSecondary : COLORS.ui.textSecondary,
            tabBarStyle: {
              backgroundColor: colorScheme === 'dark' ? DARK_COLORS.ui.surface : COLORS.ui.surface,
              borderTopColor: colorScheme === 'dark' ? DARK_COLORS.ui.border : COLORS.ui.border,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            }}
          />
          <Tabs.Screen
            name="scan"
            options={{
              title: 'Scan',
              tabBarIcon: ({ color }) => <TabBarIcon name="barcode-scan" color={color} />,
            }}
          />
          <Tabs.Screen
            name="cart"
            options={{
              title: 'Cart',
              tabBarIcon: ({ color }) => <TabBarIcon name="cart" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }) => <TabBarIcon name="account" color={color} />,
            }}
          />
          <Tabs.Screen
            name="product/[barcode]"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="compare"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="summary"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="alternatives/[barcode]"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

function TabBarIcon({ name, color }: { name: string; color: string }) {
  return <Icon source={name as any} size={24} color={color} />;
}
