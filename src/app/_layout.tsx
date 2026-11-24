import { Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from "expo-splash-screen";
import Stack from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { Toast } from "@/components/ui";
import { C, F } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  return (
    <AuthProvider>
      <RootNavigator ready={fontsLoaded || !!fontError} />
    </AuthProvider>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { status, user } = useAuth();
  const loaded = ready && status !== "loading";

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;

  const signedIn = status === "signedIn";
  return (
    // Each account gets its own cart, kits and orders on this phone.
    <StoreProvider key={user?.id ?? "guest"} userId={user?.id ?? "guest"}>
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.paper },
            headerTintColor: C.ink,
            headerTitleStyle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: C.paper },
          }}>
          <Stack.Protected guard={!signedIn} redirectTo="/">
            <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/sign-in" options={{ title: "" }} />
            <Stack.Screen name="(auth)/sign-up" options={{ title: "" }} />
            <Stack.Screen name="(auth)/verify" options={{ title: "" }} />
          </Stack.Protected>
          <Stack.Protected guard={signedIn} redirectTo="/welcome">
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" options={{ title: "", headerTransparent: true }} />
            <Stack.Screen name="pack/[slug]" options={{ title: "" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
            <Stack.Screen name="profile" options={{ title: "Business profile" }} />
            <Stack.Screen name="security/authenticator" options={{ title: "Authenticator app" }} />
            <Stack.Screen name="security/password" options={{ title: "Change password" }} />
          </Stack.Protected>
        </Stack>
        <Toast />
      </View>
    </StoreProvider>
  );
}
