import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Banner, Button, Field, Screen, T } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { errorText, useAuth } from "@/lib/auth";
import { warn } from "@/lib/haptics";

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    setError(null);
    try {
      const r = await signIn(email.trim(), password);
      if (r === "mfa") router.push("/verify");
    } catch (e) {
      warn();
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <View style={{ gap: S.sm }}>
        <T v="display">Welcome back</T>
        <T v="body" color={C.mute}>Sign in to manage orders and restock kits for your property.</T>
      </View>
      {error && <Banner>{error}</Banner>}
      <View style={{ gap: S.lg }}>
        <Field label="Email" icon="mail-outline" placeholder="you@yourproperty.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" />
        <Field label="Password" icon="lock-closed-outline" placeholder="Your password" value={password} onChangeText={setPassword} secure autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
      </View>
      <Button title="Sign in" size="lg" loading={busy} onPress={submit} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <T v="body" color={C.mute}>New to StaySupply?</T>
        <Pressable onPress={() => router.replace("/sign-up")} hitSlop={8}>
          <T v="bodyStrong" color={C.forest}>Create an account</T>
        </Pressable>
      </View>
    </Screen>
  );
}
