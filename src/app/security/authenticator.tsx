import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Linking, Platform, View } from "react-native";
import { Banner, Button, Card, Field, OtpInput, Screen, T, type IconName } from "@/components/ui";
import { C, R, S } from "@/constants/theme";
import { errorText, useAuth, type User } from "@/lib/auth";
import { success, warn } from "@/lib/haptics";
import { useStore } from "@/lib/store";

type Setup = { secret: string; otpauthUrl: string; qrDataUrl: string };
type Step = "intro" | "scan" | "confirm" | "codes";

const apps = ["Google Authenticator", "Microsoft Authenticator", "Authy", "1Password"];

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["intro", "scan", "confirm", "codes"];
  const i = order.indexOf(step);
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {order.map((s, k) => (
        <View key={s} style={{ flex: 1, height: 4, borderRadius: R.pill, backgroundColor: k <= i ? C.forest : C.line }} />
      ))}
    </View>
  );
}

function Hero({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={{ gap: S.md }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={30} color={C.forest} />
      </View>
      <T v="h1">{title}</T>
      <T v="body" color={C.mute}>{text}</T>
    </View>
  );
}

/** Shows backup codes once, with copy. */
function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { notify } = useStore();
  return (
    <>
      <Hero icon="key-outline" title="Save your backup codes" text="If you lose your phone, each of these codes lets you sign in once. Keep them somewhere safe — they won't be shown again." />
      <Card style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm, padding: S.lg }}>
        {codes.map((c) => (
          <View key={c} style={{ width: "47%", backgroundColor: C.sand, borderRadius: R.sm, paddingVertical: 12, alignItems: "center" }}>
            <T v="bodyStrong" style={{ fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), letterSpacing: 1.5 }}>{c}</T>
          </View>
        ))}
      </Card>
      <Button
        title="Copy all codes"
        variant="outline"
        icon="copy-outline"
        onPress={async () => {
          await Clipboard.setStringAsync(`StaySupply backup codes\n${codes.join("\n")}`);
          notify("Backup codes copied");
        }}
      />
      <Button title="I've saved them" size="lg" onPress={onDone} />
    </>
  );
}

export default function Authenticator() {
  const { user, setUser, authed } = useAuth();
  const { notify } = useStore();
  const [step, setStep] = useState<Step>("intro");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Management (when already on)
  const [mode, setMode] = useState<"none" | "regen" | "off">("none");
  const [password, setPassword] = useState("");

  if (!user) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      warn();
      setError(errorText(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      setSetup(await authed<Setup>("/auth/2fa/setup", { method: "POST" }));
      setStep("scan");
    });

  const confirm = (c: string) =>
    run(async () => {
      const r = await authed<{ user: User; backupCodes: string[] }>("/auth/2fa/enable", { body: { code: c } });
      success();
      setUser(r.user);
      setCodes(r.backupCodes);
      setStep("codes");
    });

  // ---------- Already turned on ----------
  if (user.twoFactorEnabled && step !== "codes") {
    if (codes)
      return (
        <Screen>
          <BackupCodes codes={codes} onDone={() => { setCodes(null); setMode("none"); }} />
        </Screen>
      );
    return (
      <Screen keyboard>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: S.md, backgroundColor: C.moss, borderColor: C.mossDeep }}>
          <Ionicons name="shield-checkmark" size={34} color={C.forest} />
          <View style={{ flex: 1 }}>
            <T v="h3">Authenticator is on</T>
            <T v="small" color={C.forestDeep}>Signing in needs your password and a code from your authenticator app.</T>
          </View>
        </Card>
        <Card>
          <T v="label" color={C.mute}>Backup codes left</T>
          <T v="h1" color={user.backupCodesLeft <= 2 ? C.clay : C.ink}>{user.backupCodesLeft} of 8</T>
          {user.backupCodesLeft <= 2 && <T v="small" color={C.clay}>You're running low. Get new codes below.</T>}
        </Card>

        {error && <Banner>{error}</Banner>}

        {mode === "none" && (
          <View style={{ gap: S.md }}>
            <Button title="Get new backup codes" variant="outline" icon="refresh-outline" onPress={() => { setMode("regen"); setError(null); }} />
            <Button title="Turn off authenticator" variant="danger" icon="shield-outline" onPress={() => { setMode("off"); setError(null); }} />
          </View>
        )}

        {mode === "regen" && (
          <Card style={{ gap: S.lg }}>
            <T v="h3">Enter a code from your app</T>
            <T v="small">Your old backup codes will stop working.</T>
            <OtpInput value={code} onChange={setCode} error={!!error} onComplete={(c) => run(async () => {
              const r = await authed<{ user: User; backupCodes: string[] }>("/auth/2fa/backup-codes", { body: { code: c } });
              setUser(r.user);
              setCodes(r.backupCodes);
              setCode("");
            })} />
            <Button title="Cancel" variant="ghost" onPress={() => { setMode("none"); setCode(""); }} />
          </Card>
        )}

        {mode === "off" && (
          <Card style={{ gap: S.lg }}>
            <T v="h3">Turn off authenticator</T>
            <T v="small">Your account will be protected by your password only.</T>
            <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} secure />
            <T v="label" color={C.ink2}>Code from your app (or a backup code)</T>
            <Field icon="keypad-outline" placeholder="123456 or XXXX-XXXX" value={code} onChangeText={setCode} autoCapitalize="characters" />
            <Button
              title="Turn off"
              variant="danger"
              loading={busy}
              disabled={!password || code.length < 6}
              onPress={() => run(async () => {
                const r = await authed<{ user: User }>("/auth/2fa/disable", { body: { password, code } });
                setUser(r.user);
                setPassword("");
                setCode("");
                setMode("none");
                setStep("intro");
                notify("Authenticator turned off");
              })}
            />
            <Button title="Cancel" variant="ghost" onPress={() => { setMode("none"); setCode(""); setPassword(""); }} />
          </Card>
        )}
      </Screen>
    );
  }

  // ---------- Setup flow ----------
  return (
    <Screen keyboard>
      <StepDots step={step} />
      {error && <Banner>{error}</Banner>}

      {step === "intro" && (
        <>
          <Hero icon="shield-checkmark-outline" title="Protect your account" text="When you sign in, we'll ask for a 6-digit code from an authenticator app on your phone, as well as your password. Someone with only your password can't get in." />
          <Card>
            <T v="label" color={C.mute}>Works with any authenticator app</T>
            {apps.map((a) => (
              <View key={a} style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 3 }}>
                <Ionicons name="checkmark-circle" size={18} color={C.forest} />
                <T v="body">{a}</T>
              </View>
            ))}
          </Card>
          <Button title="Set up authenticator" size="lg" loading={busy} onPress={start} />
        </>
      )}

      {step === "scan" && setup && (
        <>
          <Hero icon="qr-code-outline" title="Add StaySupply to your app" text="Scan this QR code from another device, or — if the app is on this phone — tap “Open in authenticator app” or copy the setup key." />
          <Card style={{ alignItems: "center", paddingVertical: S.xl }}>
            <Image source={{ uri: setup.qrDataUrl }} style={{ width: 200, height: 200 }} accessibilityLabel="QR code for your authenticator app" />
          </Card>
          {Platform.OS !== "web" && (
            <Button
              title="Open in authenticator app"
              icon="open-outline"
              variant="secondary"
              onPress={() => Linking.openURL(setup.otpauthUrl).catch(() => setError("No authenticator app found on this phone. Install one, or copy the setup key instead."))}
            />
          )}
          <Card>
            <T v="label" color={C.mute}>Setup key</T>
            <T v="bodyStrong" style={{ fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), letterSpacing: 1.2 }} >
              {setup.secret.match(/.{1,4}/g)?.join(" ")}
            </T>
            <Button
              title="Copy key"
              size="sm"
              variant="outline"
              icon="copy-outline"
              style={{ alignSelf: "flex-start" }}
              onPress={async () => {
                await Clipboard.setStringAsync(setup.secret);
                notify("Setup key copied");
              }}
            />
            <T v="small">In your app choose “Enter a setup key”, account name: {user.email}, type: time-based.</T>
          </Card>
          <Button title="Next: enter code" size="lg" iconRight="arrow-forward" onPress={() => { setStep("confirm"); setError(null); }} />
        </>
      )}

      {step === "confirm" && (
        <>
          <Hero icon="keypad-outline" title="Enter the 6-digit code" text="Type the code your authenticator app shows for StaySupply to finish setup." />
          <OtpInput value={code} onChange={(v) => { setCode(v); if (error) setError(null); }} onComplete={confirm} error={!!error} />
          <Button title="Turn on authenticator" size="lg" loading={busy} disabled={code.length < 6} onPress={() => confirm(code)} />
          <Button title="Back to QR code" variant="ghost" onPress={() => { setStep("scan"); setCode(""); setError(null); }} />
        </>
      )}

      {step === "codes" && codes && <BackupCodes codes={codes} onDone={() => { notify("Authenticator is on"); router.back(); }} />}
    </Screen>
  );
}

