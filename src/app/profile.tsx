import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Banner, Button, Field, Screen, T } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { errorText, useAuth, type User } from "@/lib/auth";
import { success } from "@/lib/haptics";
import { useStore } from "@/lib/store";

export default function Profile() {
  const { user, authed, setUser } = useAuth();
  const { notify } = useStore();
  const [f, setF] = useState({ name: user?.name ?? "", property: user?.property ?? "", phone: user?.phone ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await authed<{ user: User }>("/auth/me", { method: "PATCH", body: f });
      setUser(r.user);
      success();
      notify("Profile saved");
      router.back();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <T v="body" color={C.mute}>These details are used to fill in your delivery details at checkout.</T>
      {error && <Banner>{error}</Banner>}
      <View style={{ gap: S.lg }}>
        <Field label="Your name" icon="person-outline" value={f.name} onChangeText={on("name")} />
        <Field label="Property name" icon="business-outline" value={f.property} onChangeText={on("property")} placeholder="e.g. Haveli Homestay" />
        <Field label="Mobile" icon="call-outline" value={f.phone} onChangeText={on("phone")} keyboardType="phone-pad" />
        <Field label="Email" icon="mail-outline" value={user?.email ?? ""} editable={false} hint="Email can't be changed yet." />
      </View>
      <Button title="Save changes" size="lg" loading={busy} disabled={f.name.trim().length < 2} onPress={save} />
    </Screen>
  );
}
