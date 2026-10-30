import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';

type Entry = { id: string; text: string; image?: string; createdAt: string };
async function deviceId() {
  const key = 'noir_device_id';
  let id = typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null;
  let secureId: string | null = null;
  if (typeof window === 'undefined') secureId = await SecureStore.getItemAsync(key);
  id = id || secureId;
  if (!id) { id = `device-${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`; if (typeof window !== 'undefined') window.localStorage?.setItem(key, id); else await SecureStore.setItemAsync(key, id); }
  return id;
}
export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const device = await deviceId();
      const msgs = await api<any[]>('POST','/api/conversation/load',{ device });
      const entries = msgs.filter(m => m.role === 'user').map(m => ({ id: m.id, text: m.text, image: m.image, createdAt: m.createdAt }));
      setEntries(entries);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const render = ({ item }: { item: Entry }) => (
    <View style={styles.card}>
      {!!item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      {!!item.text && <Text style={styles.text} numberOfLines={3}>{item.text}</Text>}
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
    </View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top','bottom']}>
      <View style={styles.header}><Text style={styles.title}>History</Text></View>
      {loading ? <ActivityIndicator color="#a78bfa" style={{ marginTop: 40 }}/> : error ? <Text style={styles.error}>{error}</Text> : entries.length === 0 ? (
        <View style={styles.empty}><Ionicons name="time-outline" size={48} color="#444"/><Text style={styles.emptyText}>No entries yet</Text></View>
      ) : <FlatList data={entries} keyExtractor={i => i.id} renderItem={render} contentContainerStyle={styles.list} ListFooterComponent={<View style={{height: 60}}/>}/>}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0a0a0a'}, header:{height:56,paddingHorizontal:22,justifyContent:'center'},title:{color:'#fff',fontSize:22,fontWeight:'800',letterSpacing:1},list:{paddingHorizontal:22,paddingTop:8},card:{backgroundColor:'#171717',borderWidth:1,borderColor:'#404040',borderRadius:14,padding:16,marginBottom:12},image:{width:'100%',height:140,borderRadius:10,marginBottom:10},text:{color:'#e8e8f0',fontSize:14,lineHeight:21},date:{color:'#666',fontSize:11,marginTop:8},error:{color:'#ff9a9a',fontSize:13,marginHorizontal:22,marginTop:20},empty:{alignItems:'center',gap:12,marginTop:60},emptyText:{color:'#666',fontSize:14},
});
