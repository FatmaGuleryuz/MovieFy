
import { View, Text, StyleSheet } from 'react-native';  


export default function AnaEkran(){
    return(
        <View style={styles.container}>
            <Text style={styles.text}>Ana Ekran</Text>
        </View>
    );
}
const styles=StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#45316b',
    },

    text:{
        color:'#f3eefa',
        fontSize:18,  
        fontWeight:'bold', 
    }
});