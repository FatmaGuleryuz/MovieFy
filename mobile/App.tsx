
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import AnaEkran from './src/screens/AnaEkran';
import AramaEkran from './src/screens/AramaEkrani';
import DetayEkran from './src/screens/DetayEkrani';

//motorlari sabitlere atip kullanima hazir hale getirdik
const Yigin = createNativeStackNavigator();
const Sekme = createBottomTabNavigator();

//
function SekmeNavigasyonu() {
  return (
    <Sekme.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#1C1724' }, // Üst bar
      headerTintColor: '#EEE9F5', 
      tabBarStyle: { backgroundColor: '#1C1724' }, // Alt bar
      tabBarActiveTintColor: '#B18CFF', 
      tabBarInactiveTintColor: '#9C93AC', 
    }}>
      
      <Sekme.Screen name="Ana Sayfa" component={AnaEkran} />
      <Sekme.Screen name="Ara" component={AramaEkran} />
    </Sekme.Navigator>
  );
}

//ana uygulama yapısını Stack kuruyoruz
export default function App() {
  return (
   
    <NavigationContainer>
      {/* Sayfaların ust uste acılmasını saglayan yığın motoru */}
      <Yigin.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#1C1724' }, // Sayfa üst bar rengi
        headerTintColor: '#EEE9F5', // Sayfa üst bar yazı rengi
      }}>
        
        <Yigin.Screen name="KokDizin" component={SekmeNavigasyonu} options={{ headerShown: false }} />
      
        <Yigin.Screen name="Detay" component={DetayEkran} options={{ title: 'İçerik Detayı' }} />
      </Yigin.Navigator>
    </NavigationContainer>
  );
}