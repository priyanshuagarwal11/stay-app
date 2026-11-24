import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Stack from "expo-router/stack";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, EmptyState, IconButton, ProductArt, Qty, Screen, StickyBar, T, TierBadge, categoryVisual, st } from "@/components/ui";
import { C, F, R, S } from "@/constants/theme";
import { categoryById, productBySlug, unitPrice } from "@/data/products";
import { inr } from "@/lib/format";
import { success } from "@/lib/haptics";
import { usageNote } from "@/lib/kit-calc";
import { useStore } from "@/lib/store";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = productBySlug(slug);
  const { add, cart } = useStore();
  const insets = useSafeAreaInsets();
  const [packs, setPacks] = useState(p?.moq ?? 1);

  if (!p) return <Screen><EmptyState icon="alert-circle-outline" title="Product not found" text="It may have been removed." action="Back to shop" onAction={() => router.replace("/shop")} /></Screen>;
  const price = unitPrice(p, packs);
  const saving = p.price - price;
  const v = categoryVisual(p.category);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Stack.Screen options={{ headerRight: () => <IconButton icon="bag-handle-outline" label="Cart" badge={cart.length} onPress={() => router.push("/cart")} /> }} />
      <Screen padded={false} bottomInset={110}>
        <View style={{ backgroundColor: v.bg, paddingTop: insets.top + 56, paddingBottom: S.xxl, alignItems: "center", borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl }}>
          <ProductArt category={p.category} size={180} radius={48} style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
        </View>

        <View style={{ paddingHorizontal: S.xl, gap: S.xl }}>
          <View style={{ gap: S.sm }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TierBadge tier={p.tier} />
              <T v="small">{categoryById(p.category).name} · {p.sub}</T>
            </View>
            <T v="h1">{p.name}</T>
            <T v="body" color={C.mute}>{p.short}</T>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
            <T v="h1" color={C.forest}>{inr(price)}</T>
            <T v="body" color={C.mute} style={{ marginBottom: 3 }}>/ {p.unitLabel}</T>
            {saving > 0 && (
              <View style={{ marginLeft: "auto", backgroundColor: C.moss, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 3 }}>
                <T v="small" color={C.forestDeep} style={{ fontFamily: F.bold }}>Bulk price applied</T>
              </View>
            )}
          </View>

          {/* Bulk pricing tiers */}
          <View style={{ flexDirection: "row", gap: S.sm }}>
            {[{ min: 1, price: p.price }, ...p.bulk].map((b, i, arr) => {
              const active = packs >= b.min && (i === arr.length - 1 || packs < arr[i + 1].min);
              return (
                <View key={b.min} style={{ flex: 1, borderRadius: R.md, borderWidth: active ? 2 : 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? "#f6f9f3" : C.surface, padding: S.md, gap: 2 }}>
                  <T v="small" style={{ fontSize: 12 }}>{b.min === 1 ? `1–${arr[1].min - 1}` : `${b.min}+`} packs</T>
                  <T v="bodyStrong" color={active ? C.forest : C.ink}>{inr(b.price)}</T>
                </View>
              );
            })}
          </View>

          <Card style={{ padding: 0, gap: 0 }}>
            {[["Material", p.material], ...p.specs, ["Usage", usageNote(p)], ["Min. order", `${p.moq} pack${p.moq > 1 ? "s" : ""}`], ["In stock", `${p.stock} packs`], ["SKU", p.sku]].map(([k, val], i, arr) => (
              <View key={k} style={[st.between, { paddingVertical: 13, paddingHorizontal: S.lg }, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
                <T v="body" color={C.mute}>{k}</T>
                <T v="bodyStrong" style={{ flexShrink: 1, textAlign: "right" }}>{val}</T>
              </View>
            ))}
          </Card>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="information-circle-outline" size={18} color={C.mute} />
            <T v="small" style={{ flex: 1 }}>Sample pricing, excluding GST. Final price confirmed on your invoice.</T>
          </View>
        </View>
      </Screen>

      <StickyBar>
        <View style={st.between}>
          <View>
            <T v="small">Total · {packs} pack{packs > 1 ? "s" : ""}</T>
            <T v="h2">{inr(price * packs)}</T>
          </View>
          <Qty value={packs} min={p.moq} onChange={setPacks} />
        </View>
        <Button
          title="Add to cart"
          icon="bag-add-outline"
          size="lg"
          onPress={() => {
            add(p.id, packs);
            success();
          }}
        />
      </StickyBar>
    </View>
  );
}
