import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Platform, Pressable, View } from "react-native";
import { Button, Card, ListRow, Screen, Section, T, st } from "@/components/ui";
import { C, R, S } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/format";
import { lineTotal, useStore } from "@/lib/store";

function confirm(title: string, message: string, ok: string, onOk: () => void) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: ok, style: "destructive", onPress: onOk },
  ]);
}

export default function Account() {
  const { user, signOut } = useAuth();
  const { kits, orders, deleteKit, add, notify } = useStore();
  if (!user) return null;
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const reorderKit = (id: string) => {
    const k = kits.find((x) => x.id === id);
    if (!k) return;
    k.lines.forEach((l) => add(l.productId, l.packs));
    notify(`${k.name} added to cart`);
    router.push("/cart");
  };

  return (
    <Screen safeTop>
      <T v="h1">Account</T>

      {/* Profile card */}
      <Card onPress={() => router.push("/profile")} style={{ flexDirection: "row", alignItems: "center", gap: S.lg }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: C.forest, alignItems: "center", justifyContent: "center" }}>
          <T v="h2" color={C.white}>{initials}</T>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <T v="h3">{user.name}</T>
          <T v="small" numberOfLines={1}>{user.email}</T>
          {!!user.property && <T v="small" color={C.forest} numberOfLines={1}>{user.property}</T>}
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.faint} />
      </Card>

      {/* Security nudge */}
      {!user.twoFactorEnabled && (
        <Card elevated={false} style={{ backgroundColor: C.clayTint, borderColor: "#ecd5c2", flexDirection: "row", gap: S.md, alignItems: "center" }} onPress={() => router.push("/security/authenticator")}>
          <Ionicons name="shield-half-outline" size={26} color={C.clay} />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" color={C.clay}>Secure your account</T>
            <T v="small" color={C.clay}>Turn on an authenticator app in 2 minutes.</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.clay} />
        </Card>
      )}

      <Section title="Security">
        <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
          <ListRow
            icon="shield-checkmark-outline"
            title="Authenticator app"
            subtitle={user.twoFactorEnabled ? `On · ${user.backupCodesLeft} backup codes left` : "Off — recommended"}
            right={
              <View style={{ backgroundColor: user.twoFactorEnabled ? C.moss : C.sand, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
                <T v="small" color={user.twoFactorEnabled ? C.forest : C.mute} style={{ fontSize: 11 }}>{user.twoFactorEnabled ? "ON" : "OFF"}</T>
              </View>
            }
            onPress={() => router.push("/security/authenticator")}
          />
          <ListRow icon="key-outline" title="Change password" onPress={() => router.push("/security/password")} last />
        </Card>
      </Section>

      <Section title="Saved kits" action={kits.length ? undefined : "Build one"} onAction={() => router.push("/builder")}>
        {kits.length === 0 ? (
          <Card elevated={false} style={{ alignItems: "center", paddingVertical: S.xl }}>
            <Ionicons name="bookmark-outline" size={26} color={C.faint} />
            <T v="small" center>Save a kit from the kit builder to reorder it in one tap.</T>
          </Card>
        ) : (
          kits.map((k) => (
            <Card key={k.id}>
              <View style={st.between}>
                <T v="h3" style={{ flex: 1 }}>{k.name}</T>
                <Pressable accessibilityLabel="Delete kit" hitSlop={10} onPress={() => confirm("Delete kit?", k.name, "Delete", () => deleteKit(k.id))}>
                  <Ionicons name="trash-outline" size={19} color={C.faint} />
                </Pressable>
              </View>
              <T v="small">{k.note}</T>
              <View style={[st.between, { marginTop: S.xs }]}>
                <T v="bodyStrong">{k.lines.length} items · ≈ {inr(k.lines.reduce((s, l) => s + lineTotal(l), 0))}</T>
                <Button title="Reorder" size="sm" icon="repeat-outline" onPress={() => reorderKit(k.id)} />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section title="Orders">
        {orders.length === 0 ? (
          <Card elevated={false} style={{ alignItems: "center", paddingVertical: S.xl }}>
            <Ionicons name="receipt-outline" size={26} color={C.faint} />
            <T v="small" center>Your orders will appear here.</T>
          </Card>
        ) : (
          <Card style={{ padding: 0, gap: 0 }}>
            {orders.map((o, i) => (
              <ListRow key={o.id} icon="receipt-outline" title={`${o.id} · ${inr(o.total)}`} subtitle={`${o.property} · ${o.items} products · ${o.date}`} last={i === orders.length - 1} />
            ))}
          </Card>
        )}
      </Section>

      <Button title="Sign out" variant="outline" icon="log-out-outline" onPress={() => confirm("Sign out?", "You'll need your password to sign in again.", "Sign out", signOut)} />
      <T v="small" center>StaySupply · v1.0</T>
    </Screen>
  );
}
