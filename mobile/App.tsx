
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
      headerStyle: { backgroundColor: '#1C1724' }, // Üst barın arka plan rengi
      headerTintColor: '#EEE9F5', // Üst barın yazı rengi
      tabBarStyle: { backgroundColor: '#1C1724' }, // Alt barın arka plan rengi
      tabBarActiveTintColor: '#B18CFF', // Aktif olan sekmenin buton rengi
      tabBarInactiveTintColor: '#9C93AC', // Aktif olmayan sekmenin buton rengi
    }}>
      
      <Sekme.Screen name="Ana Sayfa" component={AnaEkran} />
      <Sekme.Screen name="Ara" component={AramaEkran} />
    </Sekme.Navigator>
  );
}

//ana uygulama yapısını Stack kuruyoruz
export default function App() {
  return (
    // Tüm navigasyonun çalışabilmesi için her şeyi en dıştan sarmalıyoruz
    <NavigationContainer>
      {/* Sayfaların üst üste açılmasını sağlayan yığın motoru */}
      <Yigin.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#1C1724' }, // Sayfa üst bar rengi
        headerTintColor: '#EEE9F5', // Sayfa üst bar yazı rengi
      }}>
        {/* İlk olarak alt sekmeleri barındıran yapıyı ana ekran olarak koyuyoruz */}
        <Yigin.Screen name="KokDizin" component={SekmeNavigasyonu} options={{ headerShown: false }} />
        {/* Detay ekranını buraya koyuyoruz ki ana sayfadan bir filme tıklanınca üstüne açılabilsin */}
        <Yigin.Screen name="Detay" component={DetayEkran} options={{ title: 'İçerik Detayı' }} />
      </Yigin.Navigator>
    </NavigationContainer>
  );
}