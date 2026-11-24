import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Banner, Button, Field, Screen, T } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { errorText, useAuth } from "@/lib/auth";
import { success, warn } from "@/lib/haptics";
import { useStore } from "@/lib/store";

export default function ChangePassword() {
  const { authed } = useAuth();
  const { notify } = useStore();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== next;
  const submit = async () => {
    if (mismatch) return;
    setBusy(true);
    setError(null);
    try {
      await authed("/auth/change-password", { body: { currentPassword: cur, newPassword: next } });
      success();
      notify("Password changed");
      router.back();
    } catch (e) {
      warn();
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <T v="body" color={C.mute}>Use at least 8 characters with letters and a number.</T>
      {error && <Banner>{error}</Banner>}
      <View style={{ gap: S.lg }}>
        <Field label="Current password" icon="lock-closed-outline" value={cur} onChangeText={setCur} secure autoComplete="current-password" />
        <Field label="New password" icon="key-outline" value={next} onChangeText={setNext} secure autoComplete="new-password" />
        <Field label="Confirm new password" icon="key-outline" value={confirm} onChangeText={setConfirm} secure error={mismatch ? "Passwords don't match." : null} />
      </View>
      <Button title="Update password" size="lg" loading={busy} disabled={!cur || next.length < 8 || confirm !== next} onPress={submit} />
    </Screen>
  );
}
