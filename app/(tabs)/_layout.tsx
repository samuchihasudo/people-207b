import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: '#25202e',
        tabBarInactiveBackgroundColor: '#0a0a0a',
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.label,
        tabBarIconSize: 22,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#0a0a0a', borderTopColor: '#242424', height: Platform.OS === 'ios' ? 88 : 72, paddingTop: 6 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
});
