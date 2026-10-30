import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../../lib/api';

type Settings = { notifications: boolean; darkMode: boolean; voiceInput: boolean };
const KEY = '***';
const defaultSettings: Settings = { notifications: false, darkMode: true, voiceInput: false };
export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [device, setDevice] = useState('');
  const saveRef = useRef<Settings>(settings);
  useEffect(() => { saveRef.current = settings; }, [settings]);
  useEffect(() => { (async () => {
    const keyId = 'noir_device_id';
    let id = Platform.OS === 'web' ? globalThis.localStorage?.getItem(keyId) : await SecureStore.getItemAsync(keyId);
    if (id) { setDevice(id); return; }
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(keyId, id); else await SecureStore.setItemAsync(keyId, id);
    setDevice(id);
    const stored = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    if (stored) { try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); } catch {} }
  })(); }, []);
  const update = (k: keyof Settings, v: boolean) => { setSettings(prev => ({ ...prev, [k]: v })); setSaved(false); };
  const persist = async () => { if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, JSON.stringify(saveRef.current)); else await SecureStore.setItemAsync(KEY, JSON.stringify(saveRef.current)); setSaved(true); try { await api('POST','/api/settings/save',{ device, ...saveRef.current }); } catch {} };
  useEffect(() => { const t = setTimeout(persist, 1500); return () => clearTimeout(t); }, [settings]);
  return (
    <SafeAreaView style={styles.screen} edges={['top','bottom']}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!!saved && <Text style={styles.saved}>Saved</Text>}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          <ToggleRow label="Dark mode" value={settings.darkMode} onValueChange={v => update('darkMode', v)}/>
          <ToggleRow label="Voice input" value={settings.voiceInput} onValueChange={v => update('voiceInput', v)} desc="Hold the mic to speak your entries aloud"/>
          <ToggleRow label="Notifications" value={settings.notifications} onValueChange={v => update('notifications', v)} desc="Streak reminders and daily prompts"/>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <Row icon="person-outline" label="Device ID" value={device.slice(0,18)+'…'} desc="Entries stay on this device only" right={false}/>
          <Row icon="help-circle-outline" label="Upgrade Pro" desc="Remove the device limit and sync entries everywhere" value="$2.99/mo" right={true}/>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Row icon="information-circle-outline" label="NOIR" desc="version 1" right={false}/>
          <Row icon="document-text-outline" label="Terms of Service" right={true}/>
          <Row icon="lock-closed-outline" label="Privacy Policy" right={true}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function ToggleRow({label,value,onValueChange,desc}:{label:string;value:boolean;onValueChange:(v:boolean)=>void;desc?:string}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Ionicons name="ellipse-outline" size={20} color="#a78bfa"/></View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{false:'#404040',true:'#a78bfa'}} thumbColor="#0a0a0a" ios_backgroundColor="#2a2a2a"/>
    </View>
  );
}
function Row({icon,label,desc,value,right}:{icon:string;label:string;desc?:string;value?:string;right:boolean}) {
  return (
    <Pressable accessibilityRole="button" style={styles.row}>
      <View style={styles.rowIcon}><Ionicons name={icon as any} size={20} color="#a78bfa"/></View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!desc && <Text style={styles.rowDesc}>{desc}</Text>}
        {!!value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {right && <Ionicons name="chevron-forward" size={16} color="#555"/>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0a0a0a'}, navbar:{height:56,paddingHorizontal:22,justifyContent:'center'},navTitle:{color:'#fff',fontSize:22,fontWeight:'800',letterSpacing:1},content:{paddingHorizontal:24,paddingTop:8},saved:{color:'#a78bfa',fontSize:12,fontWeight:'700',marginBottom:12,textAlign:'center'},section:{marginBottom:32},sectionTitle:{color:'#a78bfa',fontSize:11,letterSpacing:1.6,fontWeight:'700',marginBottom:14,paddingHorizontal:4},row:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#2a2a2a'},rowIcon:{width:24,alignItems:'center'},rowText:{flex:1},rowLabel:{color:'#f9f8fc',fontSize:15},rowDesc:{color:'#888',fontSize:13,lineHeight:18,marginTop:3},rowValue:{color:'#999',fontSize:13,marginTop:2},
});
