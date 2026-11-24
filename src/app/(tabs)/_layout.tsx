import { Ionicons } from "@expo/vector-icons";
import Tabs from "expo-router/tabs";
import { Platform, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { IconName } from "@/components/ui";
import { C, F, shadow } from "@/constants/theme";
import { tap } from "@/lib/haptics";
import { useStore } from "@/lib/store";

const icon = (name: IconName, active: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? active : name} color={color as string} size={23} />;
  };

export default function TabLayout() {
  const { cart } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenListeners={{ tabPress: () => tap() }}
      screenOptions={{
        tabBarActiveTintColor: C.forest,
        tabBarInactiveTintColor: C.faint,
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.line,
          height: 62 + (Platform.OS === "web" ? 8 : insets.bottom),
          paddingTop: 8,
          ...shadow(2),
        },
        headerStyle: { backgroundColor: C.paper },
        headerTitleStyle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: C.paper },
      }}>
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false, tabBarIcon: icon("home-outline", "home") }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", headerShown: false, tabBarIcon: icon("grid-outline", "grid") }} />
      <Tabs.Screen name="builder" options={{ title: "Kit Builder", tabBarIcon: icon("construct-outline", "construct") }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: icon("bag-handle-outline", "bag-handle"),
          tabBarBadge: cart.length || undefined,
          tabBarBadgeStyle: { backgroundColor: C.clay, fontFamily: F.bold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="account" options={{ title: "Account", headerShown: false, tabBarIcon: icon("person-circle-outline", "person-circle") }} />
    </Tabs>
  );
}
