import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PlayerEkran from './src/screens/PlayerEkrani';

import AnaEkran from './src/screens/AnaEkran';
import KesfetEkran from './src/screens/KesfetEkrani'; // Keşfet ekranı eklendi
import AramaEkran from './src/screens/AramaEkrani';
import DetayEkran from './src/screens/DetayEkrani';
import KaydedilenlerEkran from './src/screens/Kaydedilenler'; 
import OyuncuEkran from './src/screens/OyuncuEkrani';

const Yigin = createNativeStackNavigator();
const Sekme = createBottomTabNavigator();

function SekmeNavigasyonu() {
  return (
    <Sekme.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#141414',
          borderTopWidth: 0,
          height: 60,
          elevation: 0, // Tab bar altındaki gölge sıfırlandı
          shadowOpacity: 0,
        },
        tabBarButton: ({ children, ref, ...props }) => (
          <Pressable
            {...props}
            style={({ pressed }) => [
              props.style,
              styles.tabButton,
              pressed && styles.tabButtonPressed,
            ]}
          >
            {children}
          </Pressable>
        ),
      }}
    >
      {/* 1. Ana Sayfa */}
      <Sekme.Screen
        name="Ana Sayfa"
        component={AnaEkran}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={focused ? '#7709e5' : '#8E8E93'}
              style={focused ? styles.activeIconShadow : null}
            />
          ),
        }}
      />

      {/* 2. Keşfet (YENİ) */}
      <Sekme.Screen
        name="Keşfet"
        component={KesfetEkran}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={26}
              color={focused ? '#7709e5' : '#8E8E93'}
              style={focused ? styles.activeIconShadow : null}
            />
          ),
        }}
      />

      {/* 3. Arama */}
      <Sekme.Screen
        name="Ara"
        component={AramaEkran}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={26}
              color={focused ? '#7709e5' : '#8E8E93'}
              style={focused ? styles.activeIconShadow : null}
            />
          ),
        }}
      />
      
      {/* 4. Kaydedilenler */}
      <Sekme.Screen
        name="Kaydedilenler"
        component={KaydedilenlerEkran}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={focused ? '#7709e5' : '#8E8E93'}
              style={focused ? styles.activeIconShadow : null}
            />
          ),
        }}
      />
    </Sekme.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: '#141414' }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#141414' }} edges={['bottom']}>
        <NavigationContainer>
          <Yigin.Navigator>
            <Yigin.Screen
              name="KokDizin"
              component={SekmeNavigasyonu}
              options={{ headerShown: false }}
            />
            <Yigin.Screen
              name="Detay"
              component={DetayEkran}
              options={{ headerShown: false }}
            />
            <Yigin.Screen
              name="Oyuncu"
              component={OyuncuEkran}
              options={{ headerShown: false }}
            />
            <Yigin.Screen
              name="Player"
              component={PlayerEkran}
              options={{ headerShown: false }}
/>
          </Yigin.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.88 }],
  },
  activeIconShadow: {
    elevation: 8,
    shadowColor: '#7709e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});