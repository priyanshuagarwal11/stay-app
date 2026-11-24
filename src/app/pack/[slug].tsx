import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Stack from "expo-router/stack";
import { View } from "react-native";
import { Button, Card, EmptyState, ProductArt, Screen, StickyBar, T, st } from "@/components/ui";
import { C, R, S } from "@/constants/theme";
import { packLines, packs, packTotal } from "@/data/kits";
import { inr } from "@/lib/format";
import { success } from "@/lib/haptics";
import { useStore } from "@/lib/store";

export default function PackScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const pack = packs.find((p) => p.slug === slug);
  const { add, notify } = useStore();
  if (!pack) return <Screen><EmptyState icon="alert-circle-outline" title="Pack not found" text="It may have been removed." action="Back to shop" onAction={() => router.replace("/shop")} /></Screen>;
  const lines = packLines(pack);
  const total = packTotal(pack);

  const addAll = () => {
    lines.forEach((l) => add(l.product.id, l.packs));
    success();
    notify(`${pack.name} added to cart`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Stack.Screen options={{ title: "" }} />
      <Screen bottomInset={pack.custom ? 90 : 150}>
        <View style={{ gap: S.md }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={pack.custom ? "color-palette-outline" : "cube-outline"} size={30} color={C.forest} />
          </View>
          <T v="display">{pack.name}</T>
          <T v="body" color={C.mute}>{pack.blurb}</T>
          <View style={{ flexDirection: "row", gap: S.sm, flexWrap: "wrap" }}>
            {[pack.forWhom, pack.rooms > 0 ? `${pack.rooms} room${pack.rooms > 1 ? "s" : ""} · 1 month` : null, `${lines.length} products`]
              .filter(Boolean)
              .map((x) => (
                <View key={x} style={{ backgroundColor: C.sand, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <T v="small" color={C.ink2}>{x}</T>
                </View>
              ))}
          </View>
        </View>

        <Card style={{ padding: 0, gap: 0 }}>
          {lines.map((l, i) => (
            <View key={l.product.id} style={[st.row, { padding: S.md, paddingHorizontal: S.lg }, i < lines.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
              <ProductArt category={l.product.category} size={46} />
              <View style={{ flex: 1, gap: 1 }}>
                <T v="bodyStrong" numberOfLines={1}>{l.product.name}</T>
                <T v="small">{l.qty} units · {l.packs} × {l.product.unitLabel}</T>
              </View>
              <T v="bodyStrong">{inr(l.total)}</T>
            </View>
          ))}
        </Card>
        <T v="small">Sample prices, excluding GST. You can change quantities in your cart.</T>
      </Screen>

      <StickyBar>
        {pack.custom ? (
          <Button title="Request a quote" icon="mail-outline" size="lg" onPress={() => notify("Quote request noted — we'll contact you")} />
        ) : (
          <>
            <View style={st.between}>
              <T v="small">Pack total</T>
              <T v="h2">{inr(total)}</T>
            </View>
            <View style={{ flexDirection: "row", gap: S.sm }}>
              <Button title="Customise" variant="outline" size="lg" onPress={() => router.push("/builder")} style={{ flex: 1 }} />
              <Button title="Add pack" icon="bag-add-outline" size="lg" onPress={addAll} style={{ flex: 1.6 }} />
            </View>
          </>
        )}
      </StickyBar>
    </View>
  );
}
