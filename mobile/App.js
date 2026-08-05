import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AnaEkran from './src/screens/AnaEkran';
import KesfetEkran from './src/screens/KesfetEkrani'; 
import AramaEkran from './src/screens/AramaEkrani';
import DetayEkran from './src/screens/DetayEkrani';
import KaydedilenlerEkran from './src/screens/ListemEkrani'; 
import OyuncuEkran from './src/screens/OyuncuEkrani';
import PlayerEkrani from './src/screens/PlayerEkrani';

const Yigin = createNativeStackNavigator();
const Sekme = createBottomTabNavigator();

function SekmeNavigasyonu({ isSplashFinished, setIsSplashFinished }) {
  return (
    <Sekme.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1f1f1f',
          borderTopWidth: 1,
          borderTopColor: '#2a2a2a',
          height: 60,
          elevation: 0,
          shadowOpacity: 0,
          justifyContent: 'center',
          alignItems: 'center',
          display: isSplashFinished ? 'flex' : 'none',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        },
        tabBarButton: ({ children, ...props }) => (
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
      <Sekme.Screen
        name="Ana Sayfa"
        component={AnaEkran}
        initialParams={{ onSplashFinish: () => setIsSplashFinished(true) }}
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
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  return (
    <SafeAreaProvider style={{ backgroundColor: '#141414' }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#141414' }} edges={['bottom']}>
        <NavigationContainer>
          <Yigin.Navigator screenOptions={{ headerShown: false }}>
            <Yigin.Screen name="KokDizin">
              {(props) => (
                <SekmeNavigasyonu
                  {...props}
                  isSplashFinished={isSplashFinished}
                  setIsSplashFinished={setIsSplashFinished}
                />
              )}
            </Yigin.Screen>
            <Yigin.Screen name="Detay" component={DetayEkran} />
            <Yigin.Screen name="Oyuncu" component={OyuncuEkran} />
            <Yigin.Screen name="Player" component={PlayerEkrani} />
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
    height: '100%',
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