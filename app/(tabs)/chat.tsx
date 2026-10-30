import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { shrinkPhoto } from '../../lib/shrink-photo';

type Message = { id: string; role: 'user' | 'assistant'; text: string; image?: string; day?: string; createdAt: string };
const localDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function streak(messages: Message[]) {
  const days = new Set(messages.filter(m => m.role === 'user' && m.day).map(m => m.day));
  const d = new Date();
  if (!days.has(localDay(d))) d.setDate(d.getDate()-1);
  let count = 0;
  while (days.has(localDay(d))) { count++; d.setDate(d.getDate()-1); }
  return count;
}
async function deviceId() {
  const key = 'noir_device_id';
  let id = Platform.OS === 'web' ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, id); else await SecureStore.setItemAsync(key, id);
  }
  return id;
}
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [device, setDevice] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const router = useRouter();
  useEffect(() => { (async () => { try { const id = await deviceId(); setDevice(id); setMessages(await api<Message[]>('POST','/api/conversation/load',{ device: id })); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } })(); }, []);
  const pick = async () => { try { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 }); if (!result.canceled) { const photo = await shrinkPhoto(result.assets[0]); setImage(photo.dataUrl); } } catch (e) { setError((e as Error).message); } };
  const send = async () => {
    if ((!text.trim() && !image) || busy || !device) return;
    setBusy(true); setError('');
    try {
      const result = await api<{entry: Message; reply?: Message; error?: string}>('POST','/api/conversation/send',{ device, text, image, day: localDay(new Date()) });
      setMessages(current => [...current, result.entry, ...(result.reply ? [result.reply] : [])]); setText(''); setImage('');
      if (result.error) setError(result.error);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <SafeAreaView style={styles.screen} edges={['top','bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}><Ionicons name="sparkles" size={19} color="#0a0a0a" /></View>
            <View><Text style={styles.brandName}>NOIR</Text><Text style={styles.brandSub}>YOUR AI SPACE</Text></View>
          </View>
          <View style={styles.streak}><Ionicons name="flame-outline" size={17} color="#a78bfa"/><Text style={styles.streakText}>{streak(messages)} day streak</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.settings} onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={20} color="#a78bfa"/></Pressable>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled">
          {loading ? <ActivityIndicator color="#a78bfa" style={{marginTop: 60}} /> : messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.orb}><Ionicons name="sparkles-outline" size={36} color="#a78bfa" /></View>
              <Text style={styles.eyebrow}>A LITTLE SPACE FOR BIG IDEAS</Text>
              <Text style={styles.title}>What's on your mind?</Text>
              <Text style={styles.subtitle}>Ask a question, share a thought, or add a photo. Start anywhere.</Text>
              <Pressable accessibilityRole="button" style={styles.quick} onPress={() => input.current?.focus()}>
                <Ionicons name="add" size={23} color="#0a0a0a"/>
                <Text style={styles.quickText}>Start a new entry</Text>
                <Ionicons name="arrow-forward" size={19} color="#0a0a0a"/>
              </Pressable>
              <Text style={styles.hint}>A MOMENT A DAY ADDS UP</Text>
            </View>
          ) : messages.map(m => (
            <View key={m.id} style={[styles.message, m.role === 'user' ? styles.user : styles.assistant]}>
              <Text style={styles.messageLabel}>{m.role === 'user' ? 'YOU' : 'NOIR'}</Text>
              {!!m.image && <Image source={{uri:m.image}} style={styles.photo} />}
              {!!m.text && <Text style={styles.messageText}>{m.text}</Text>}
            </View>
          ))}
          {busy && <View style={styles.thinking}><ActivityIndicator size="small" color="#a78bfa"/><Text style={styles.muted}>Thinking...</Text></View>}
        </ScrollView>
        <View style={styles.bottom}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!image && <View style={styles.preview}>
            <Image source={{uri:image}} style={styles.thumb}/>
            <Text style={styles.muted}>Photo attached</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setImage('')} style={styles.remove}><Ionicons name="close" size={20} color="#ddd"/></Pressable>
          </View>}
          <View style={styles.composer}>
            <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={pick} style={styles.iconButton}><Ionicons name="add-circle-outline" size={25} color="#a78bfa"/></Pressable>
            <TextInput ref={input} value={text} onChangeText={setText} placeholder="Ask or add an entry..." placeholderTextColor="#777" style={styles.input} multiline />
            <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={send} disabled={busy || loading || !router} style={styles.send}><Ionicons name="arrow-up" size={22} color="#0a0a0a"/></Pressable>
          </View>
          <Text style={styles.disclaimer}>AI can make mistakes. Check important information.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0a0a0a'}, flex:{flex:1}, header:{height:76, paddingHorizontal:22, flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#242424'},brand:{flexDirection:'row',alignItems:'center',gap:10},brandIcon:{width:38,height:38,borderRadius:13,backgroundColor:'#a78bfa',alignItems:'center',justifyContent:'center'},brandName:{color:'#fff',fontSize:16,fontWeight:'800',letterSpacing:2},brandSub:{color:'#858585',fontSize:9,letterSpacing:1.2,marginTop:3},streak:{flexDirection:'row',gap:6,alignItems:'center',backgroundColor:'#1c1923',borderWidth:1,borderColor:'#404040',borderRadius:22,paddingHorizontal:12,paddingVertical:9},streakText:{color:'#d9ccff',fontSize:12,fontWeight:'600'}, settings:{padding:8},content:{paddingHorizontal:22,paddingBottom:24,flexGrow:1},welcome:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:45},orb:{width:80,height:80,borderRadius:28,backgroundColor:'#211a30',borderWidth:1,borderColor:'#51416e',alignItems:'center',justifyContent:'center',marginBottom:30},eyebrow:{fontSize:10,letterSpacing:2,color:'#a78bfa',fontWeight:'700',textAlign:'center'},title:{color:'#f9f8fc',fontSize:32,fontWeight:'700',letterSpacing:-1,marginTop:13,textAlign:'center'},subtitle:{color:'#999',fontSize:15,lineHeight:23,textAlign:'center',maxWidth:300,marginTop:12},quick:{marginTop:33,backgroundColor:'#a78bfa',borderRadius:16,minHeight:58,width:'100%',maxWidth:330,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},quickText:{fontSize:15,fontWeight:'700',color:'#0a0a0a'},hint:{fontSize:9,letterSpacing:1.6,color:'#676767',marginTop:25},message:{padding:16,borderRadius:18,marginTop:16,maxWidth:'93%'},user:{alignSelf:'flex-end',backgroundColor:'#25202e',borderWidth:1,borderColor:'#40364e'},assistant:{alignSelf:'flex-start',backgroundColor:'#171717',borderWidth:1,borderColor:'#404040'},messageLabel:{color:'#a78bfa',fontSize:10,fontWeight:'800',letterSpacing:1.4,marginBottom:9},messageText:{color:'#f0eef3',fontSize:15,lineHeight:23},photo:{width:210,height:160,borderRadius:12,marginBottom:10},thinking:{flexDirection:'row',alignItems:'center',gap:10,marginTop:20},muted:{color:'#999',fontSize:13},bottom:{paddingHorizontal:16,paddingBottom:8},composer:{flexDirection:'row',alignItems:'flex-end',backgroundColor:'#1a1a1a',borderColor:'#404040',borderWidth:1,borderRadius:22,padding:7},iconButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},input:{flex:1,color:'#fff',fontSize:16,maxHeight:120,minHeight:44,paddingVertical:11,paddingHorizontal:4},send:{width:44,height:44,borderRadius:15,backgroundColor:'#a78bfa',alignItems:'center',justifyContent:'center'},disclaimer:{color:'#666',fontSize:10,textAlign:'center',marginTop:10},error:{color:'#ff9a9a',fontSize:13,marginBottom:9},preview:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:9},thumb:{width:48,height:48,borderRadius:8},remove:{marginLeft:'auto',padding:10}
});
