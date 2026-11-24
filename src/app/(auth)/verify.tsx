import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Banner, Button, Field, OtpInput, Screen, T } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { ApiError } from "@/lib/api";
import { errorText, useAuth } from "@/lib/auth";
import { success, warn } from "@/lib/haptics";

export default function Verify() {
  const { verifyCode, mfaToken, cancelMfa } = useAuth();
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No pending sign-in (e.g. app was reloaded) — go back to the password step.
  useEffect(() => {
    if (!mfaToken) router.replace("/sign-in");
  }, [mfaToken]);

  const submit = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyCode(value);
      success();
    } catch (e) {
      warn();
      setError(errorText(e));
      setCode("");
      if (e instanceof ApiError && e.code === "mfa_expired") {
        cancelMfa();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <View style={{ alignItems: "center", gap: S.md, marginTop: S.lg }}>
        <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={useBackup ? "key-outline" : "shield-checkmark-outline"} size={36} color={C.forest} />
        </View>
        <T v="h1" center>{useBackup ? "Use a backup code" : "Two-step verification"}</T>
        <T v="body" color={C.mute} center>
          {useBackup
            ? "Enter one of the 8-character backup codes you saved when you set up your authenticator. Each code works once."
            : "Open your authenticator app and enter the 6-digit code for StaySupply."}
        </T>
      </View>

      {error && <Banner>{error}</Banner>}

      {useBackup ? (
        <View style={{ gap: S.lg }}>
          <Field icon="key-outline" placeholder="XXXX-XXXX" value={backup} onChangeText={setBackup} autoCapitalize="characters" autoCorrect={false} />
          <Button title="Verify" size="lg" loading={busy} disabled={backup.replace(/[^a-z0-9]/gi, "").length < 8} onPress={() => submit(backup)} />
        </View>
      ) : (
        <View style={{ gap: S.xl }}>
          <OtpInput value={code} onChange={(v) => { setCode(v); if (error) setError(null); }} onComplete={submit} error={!!error} />
          <Button title="Verify" size="lg" loading={busy} disabled={code.length < 6} onPress={() => submit(code)} />
        </View>
      )}

      <Pressable onPress={() => { setUseBackup((b) => !b); setError(null); }} hitSlop={8} style={{ alignSelf: "center" }}>
        <T v="bodyStrong" color={C.forest}>{useBackup ? "Use authenticator app instead" : "Lost your phone? Use a backup code"}</T>
      </Pressable>
      <Pressable onPress={() => { cancelMfa(); router.replace("/sign-in"); }} hitSlop={8} style={{ alignSelf: "center" }}>
        <T v="body" color={C.mute}>Cancel and go back</T>
      </Pressable>
    </Screen>
  );
}
