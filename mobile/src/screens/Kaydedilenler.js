import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function KaydedilenlerEkrani() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kaydedilenler Ekranı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#45316b' // Uygulamanın koyu temasıyla uyumlu
  },
  text: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});