import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, Card, EmptyState, ProductArt, Qty, Screen, StickyBar, T, st } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { productById, unitPrice } from "@/data/products";
import { inr } from "@/lib/format";
import { FREE_DELIVERY_FROM, GST_RATE, totals } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function Cart() {
  const { cart, subtotal, setPacks, remove, clear } = useStore();
  const t = totals(subtotal);

  if (cart.length === 0)
    return (
      <Screen>
        <EmptyState icon="bag-handle-outline" title="Your cart is empty" text="Add products, a ready-made pack, or build a kit sized for your property." action="Build a kit" onAction={() => router.push("/builder")} />
        <Button title="Browse products" variant="ghost" onPress={() => router.push("/shop")} />
      </Screen>
    );

  const toFree = FREE_DELIVERY_FROM - subtotal;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Screen bottomInset={130}>
        {toFree > 0 ? (
          <Card elevated={false} style={{ backgroundColor: C.clayTint, borderColor: C.clayTint, flexDirection: "row", gap: S.md, alignItems: "center" }}>
            <Ionicons name="car-outline" size={22} color={C.clay} />
            <T v="small" color={C.clay} style={{ flex: 1 }}>Add {inr(toFree)} more for free delivery.</T>
          </Card>
        ) : (
          <Card elevated={false} style={{ backgroundColor: C.moss, borderColor: C.moss, flexDirection: "row", gap: S.md, alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={22} color={C.forest} />
            <T v="small" color={C.forestDeep} style={{ flex: 1 }}>Your order gets free delivery.</T>
          </Card>
        )}

        <View style={st.between}>
          <T v="h2">{cart.length} item{cart.length > 1 ? "s" : ""}</T>
          <Pressable onPress={clear} hitSlop={8}>
            <T v="label" color={C.danger}>Clear all</T>
          </Pressable>
        </View>

        <Card style={{ padding: 0, gap: 0 }}>
          {cart.map((l, i) => {
            const p = productById(l.productId);
            if (!p) return null;
            const each = unitPrice(p, l.packs);
            return (
              <View key={l.productId} style={[{ padding: S.lg, gap: S.md }, i < cart.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
                <View style={[st.row, { alignItems: "flex-start" }]}>
                  <Pressable onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })}>
                    <ProductArt category={p.category} size={56} />
                  </Pressable>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyStrong" numberOfLines={2}>{p.name}</T>
                    <T v="small">{inr(each)} / {p.unitLabel}</T>
                  </View>
                  <Pressable accessibilityLabel={`Remove ${p.name}`} onPress={() => remove(p.id)} hitSlop={10}>
                    <Ionicons name="close" size={20} color={C.faint} />
                  </Pressable>
                </View>
                <View style={st.between}>
                  <Qty compact value={l.packs} min={p.moq} onChange={(n) => setPacks(p.id, n)} />
                  <T v="price">{inr(each * l.packs)}</T>
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          {[
            ["Subtotal", inr(subtotal)],
            [`GST (${GST_RATE * 100}%)`, inr(t.gst)],
            ["Delivery", t.delivery ? inr(t.delivery) : "Free"],
          ].map(([k, v]) => (
            <View key={k} style={st.between}>
              <T v="body" color={C.mute}>{k}</T>
              <T v="bodyStrong">{v}</T>
            </View>
          ))}
        </Card>
      </Screen>

      <StickyBar>
        <View style={st.between}>
          <T v="small">Total incl. GST</T>
          <T v="h2">{inr(t.total)}</T>
        </View>
        <Button title="Checkout" iconRight="arrow-forward" size="lg" onPress={() => router.push("/checkout")} />
      </StickyBar>
    </View>
  );
}
