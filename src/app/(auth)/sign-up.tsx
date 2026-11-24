import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Banner, Button, Field, Screen, T } from "@/components/ui";
import { C, F, R, S } from "@/constants/theme";
import { errorText, useAuth } from "@/lib/auth";
import { success, warn } from "@/lib/haptics";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || /[A-Z]/.test(pw)) s++;
  return s; // 0..4
}
const levels = [
  { t: "Too short", c: C.danger },
  { t: "Weak", c: C.danger },
  { t: "Okay", c: C.clay },
  { t: "Good", c: C.forest },
  { t: "Strong", c: C.success },
];

export default function SignUp() {
  const { signUp } = useAuth();
  const [f, setF] = useState({ name: "", property: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const on = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const errors = useMemo(
    () => ({
      name: f.name.trim().length < 2 ? "Enter your name." : null,
      email: /^\S+@\S+\.\S+$/.test(f.email.trim()) ? null : "Enter a valid email address.",
      password: f.password.length < 8 ? "At least 8 characters." : !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password) ? "Use letters and at least one number." : null,
    }),
    [f],
  );
  const pw = strength(f.password);

  const submit = async () => {
    setTouched(true);
    if (errors.name || errors.email || errors.password) return warn();
    setBusy(true);
    setError(null);
    try {
      await signUp({ ...f, email: f.email.trim() });
      success();
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
        <T v="display">Create your account</T>
        <T v="body" color={C.mute}>Set up StaySupply for your property. It takes under a minute.</T>
      </View>
      {error && <Banner>{error}</Banner>}
      <View style={{ gap: S.lg }}>
        <Field label="Your name" icon="person-outline" placeholder="Full name" value={f.name} onChangeText={on("name")} autoComplete="name" error={touched ? errors.name : null} />
        <Field label="Property name (optional)" icon="business-outline" placeholder="e.g. Haveli Homestay" value={f.property} onChangeText={on("property")} />
        <Field label="Work email" icon="mail-outline" placeholder="you@yourproperty.com" value={f.email} onChangeText={on("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={touched ? errors.email : null} />
        <Field label="Mobile (optional)" icon="call-outline" placeholder="10-digit number" value={f.phone} onChangeText={on("phone")} keyboardType="phone-pad" autoComplete="tel" />
        <View style={{ gap: 8 }}>
          <Field label="Password" icon="lock-closed-outline" placeholder="At least 8 characters" value={f.password} onChangeText={on("password")} secure autoComplete="new-password" textContentType="newPassword" error={touched ? errors.password : null} />
          {f.password.length > 0 && (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flex: 1, height: 4, borderRadius: R.pill, backgroundColor: i < pw ? levels[pw].c : C.line }} />
                ))}
              </View>
              <T v="small" color={levels[pw].c} style={{ fontFamily: F.semibold }}>{levels[pw].t} password</T>
            </View>
          )}
        </View>
      </View>
      <Button title="Create account" size="lg" loading={busy} onPress={submit} />
      <T v="small" center>You can turn on an authenticator app for extra security after signing up.</T>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
        <T v="body" color={C.mute}>Already have an account?</T>
        <Pressable onPress={() => router.replace("/sign-in")} hitSlop={8}>
          <T v="bodyStrong" color={C.forest}>Sign in</T>
        </Pressable>
      </View>
    </Screen>
  );
}
