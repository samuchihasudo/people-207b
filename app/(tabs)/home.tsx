import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { shrinkPhoto } from '../../lib/shrink-photo';

type Entry = { id: string; text: string; image?: string; day: string; createdAt: string };
const localDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
async function deviceId() {
  const key = 'noir_device_id';
  let id = typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null;
  let secureId: string | null = null;
  if (typeof window === 'undefined') secureId = await SecureStore.getItemAsync(key);
  id = id || secureId;
  if (!id) { id = `device-${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`; if (typeof window !== 'undefined') window.localStorage?.setItem(key, id); else await SecureStore.setItemAsync(key, id); }
  return id;
}
function streak(entries: Entry[]) {
  const days = new Set(entries.map(e => e.day));
  const d = new Date();
  let count = 0;
  while (days.has(localDay(d))) { count++; d.setDate(d.getDate()-1); }
  return count;
}
export default function HomeScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [device, setDevice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async (id: string) => { try { setEntries(await api<Entry[]>('POST','/api/conversation/load',{ device: id })); } catch (e) { setError((e as Error).message); } };
  useEffect(() => { (async () => { try { const id = await deviceId(); setDevice(id); await load(id); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } })(); }, []);
  const today = new Date();
  const todayStr = localDay(today);
  const todayEntries = entries.filter(e => e.day === todayStr);
  const recent = entries.filter(e => e.day !== todayStr).slice(0, 5);
  const s = streak(entries);
  return (
    <SafeAreaView style={styles.screen} edges={['top','bottom']}>
      <View style={styles.header}>
        <View style={styles.brand}><View style={styles.brandIcon}><Ionicons name="sparkles" size={19} color="#0a0a0a" /></View><View><Text style={styles.brandName}>NOIR</Text><Text style={styles.brandSub}>YOUR AI SPACE</Text></View></View>
      </View>
      <View style={styles.streakCard}>
        <View style={styles.streakInner}><Ionicons name="flame" size={32} color="#a78bfa" /><Text style={styles.streakNum}>{s}</Text><Text style={styles.streakLabel}>DAY STREAK</Text></View>
        <View style={styles.streakSub}><Text style={styles.streakHint}>Keep adding entries daily to grow your streak</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY</Text>
        {todayEntries.length === 0 ? <View style={styles.empty}><Ionicons name="add-circle-outline" size={28} color="#555"/><Text style={styles.emptyText}>No entries yet today</Text></View> : todayEntries.map(e => <EntryCard key={e.id} entry={e} />)}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT</Text>
        {recent.length === 0 ? <Text style={styles.note}>Your history is empty.</Text> : recent.map(e => <EntryCard key={e.id} entry={e} small />)}
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="New entry" style={styles.addBtn} onPress={async () => { try { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 }); if (!result.canceled && device) { const photo = await shrinkPhoto(result.assets[0]); await api('POST','/api/conversation/send',{ device, text: '', image: photo.dataUrl, day: todayStr }); } } catch (e) { setError((e as Error).message); } }}>
          <Ionicons name="add" size={28} color="#0a0a0a"/>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
function EntryCard({ entry, small }: { entry: Entry; small?: boolean }) {
  const d = new Date(entry.createdAt);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[styles.card, small && styles.cardSmall]}>
      {!!entry.image && <Image source={{ uri: entry.image }} style={[styles.cardImage, small && styles.cardImageSmall]} />}
      {!!entry.text && <Text style={styles.cardText} numberOfLines={small ? 2 : undefined}>{entry.text}</Text>}
      <View style={styles.cardMeta}><Text style={styles.cardDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text><Text style={styles.cardTime}>{time}</Text></View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0a0a0a'}, header:{height:56,paddingHorizontal:22,justifyContent:'center'},brand:{flexDirection:'row',alignItems:'center',gap:10},brandIcon:{width:34,height:34,borderRadius:11,backgroundColor:'#a78bfa',alignItems:'center',justifyContent:'center'},brandName:{color:'#fff',fontSize:16,fontWeight:'800',letterSpacing:2},brandSub:{color:'#858585',fontSize:9,letterSpacing:1.2,marginTop:3},streakCard:{backgroundColor:'#1a1a1a',borderWidth:1,borderColor:'#404040',borderRadius:18,marginHorizontal:22,padding:24,marginTop:18,marginBottom:18},streakInner:{alignItems:'center',gap:6},streakNum:{color:'#a78bfa',fontSize:44,fontWeight:'800'},streakLabel:{color:'#888',fontSize:11,letterSpacing:2,fontWeight:'700'},streakSub:{alignItems:'center',marginTop:12},streakHint:{color:'#666',fontSize:12},section:{paddingHorizontal:24,marginBottom:22},sectionTitle:{color:'#a78bfa',fontSize:11,letterSpacing:1.6,fontWeight:'700',marginBottom:12},empty:{alignItems:'center',gap:8,paddingVertical:24},emptyText:{color:'#555',fontSize:14},note:{color:'#666',fontSize:13,paddingVertical:10},card:{backgroundColor:'#171717',borderWidth:1,borderColor:'#404040',borderRadius:14,padding:16,marginBottom:12},cardSmall:{padding:12},cardImage:{width:'100%',height:160,borderRadius:10,marginBottom:10},cardImageSmall:{height:100},cardText:{color:'#e8e8f0',fontSize:14,lineHeight:21},cardMeta:{flexDirection:'row',gap:12,marginTop:10},cardDate:{color:'#666',fontSize:11},cardTime:{color:'#666',fontSize:11,marginLeft:'auto'},actions:{position:'absolute',bottom:30,right:24},addBtn:{width:64,height:64,borderRadius:32,backgroundColor:'#a78bfa',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#0a0a0a',elevation:4},
});
