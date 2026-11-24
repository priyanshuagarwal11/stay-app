import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, IconButton, ProductArt, Section, T, categoryVisual, type IconName } from "@/components/ui";
import { C, F, R, S, shadow } from "@/constants/theme";
import { packs, packTotal } from "@/data/kits";
import { categories, products } from "@/data/products";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/format";
import { useStore } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const quick: { icon: IconName; title: string; sub: string; to: () => void }[] = [
  { icon: "construct-outline", title: "Build a kit", sub: "Exact quantities", to: () => router.push("/builder") },
  { icon: "cube-outline", title: "Packs", sub: "Ready-made", to: () => router.push({ pathname: "/shop", params: { view: "packs" } }) },
  { icon: "repeat-outline", title: "Reorder", sub: "Saved kits", to: () => router.push("/account") },
];

export default function Home() {
  const { user } = useAuth();
  const { cart, kits } = useStore();
  const first = user?.name.split(" ")[0] ?? "";
  const featured = products.filter((p) => p.tier === "premium").slice(0, 6);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, gap: S.xxl }}>
        {/* Header */}
        <View style={{ paddingHorizontal: S.xl, paddingTop: S.md, gap: S.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
            <View style={{ flex: 1 }}>
              <T v="small">{greeting()}{first ? "," : ""}</T>
              <T v="h1" numberOfLines={1}>{first || "Welcome"}</T>
              {!!user?.property && <T v="small" color={C.forest} style={{ fontFamily: F.semibold }} numberOfLines={1}>{user.property}</T>}
            </View>
            <IconButton icon="bag-handle-outline" label="Cart" badge={cart.length} onPress={() => router.push("/cart")} size={44} />
          </View>
          <Pressable onPress={() => router.push({ pathname: "/shop", params: { focus: "1" } })} style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderRadius: R.pill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18 }, shadow(1), pressed && { opacity: 0.85 }]}>
            <Ionicons name="search" size={19} color={C.faint} />
            <T v="body" color={C.faint}>Search towels, shampoo, tea…</T>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={{ paddingHorizontal: S.xl }}>
          <LinearGradient colors={[C.forest, C.forestDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: R.xl, padding: S.xxl, overflow: "hidden", gap: S.md }}>
            <View pointerEvents="none" style={{ position: "absolute", right: -30, bottom: -60, flexDirection: "row", gap: 10, opacity: 0.14 }}>
              {[120, 160].map((h) => (
                <View key={h} style={{ width: 80, height: h + 60, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderWidth: 2, borderColor: C.white }} />
              ))}
            </View>
            <View style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
              <T v="caption" color="#d6e3d8">Kit builder</T>
            </View>
            <T v="display" color={C.white} style={{ fontSize: 28, lineHeight: 33 }}>Restock the whole property in one order.</T>
            <T v="body" color="#cfdcd1">Tell us your rooms and occupancy — we'll work out exactly how much you need.</T>
            <Button title="Build my kit" variant="light" iconRight="arrow-forward" onPress={() => router.push("/builder")} style={{ alignSelf: "flex-start", marginTop: S.xs }} />
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: S.md, paddingHorizontal: S.xl }}>
          {quick.map((q) => (
            <Card key={q.title} onPress={q.to} style={{ flex: 1, padding: S.md, gap: 8 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={q.icon} size={20} color={C.forest} />
              </View>
              <View>
                <T v="h3" style={{ fontSize: 14.5 }}>{q.title}</T>
                <T v="small" style={{ fontSize: 12 }}>{q.title === "Reorder" && kits.length ? `${kits.length} saved` : q.sub}</T>
              </View>
            </Card>
          ))}
        </View>

        {/* Categories */}
        <View style={{ gap: S.md }}>
          <View style={{ paddingHorizontal: S.xl }}>
            <Section title="Categories" action="See all" onAction={() => router.push("/shop")}>{null}</Section>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.xl, gap: S.lg }}>
            {categories.map((c) => {
              const v = categoryVisual(c.id);
              return (
                <Pressable key={c.id} onPress={() => router.push({ pathname: "/shop", params: { cat: c.id } })} style={({ pressed }) => [{ alignItems: "center", gap: 8, width: 88 }, pressed && { opacity: 0.7 }]}>
                  <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: v.bg, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={v.icon} size={28} color={v.fg} />
                  </View>
                  <T v="small" color={C.ink2} center numberOfLines={1} style={{ fontSize: 12 }}>{c.name}</T>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Packs */}
        <View style={{ gap: S.md }}>
          <View style={{ paddingHorizontal: S.xl }}>
            <Section title="Ready-made packs" action="All packs" onAction={() => router.push({ pathname: "/shop", params: { view: "packs" } })}>{null}</Section>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={262} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: S.xl, gap: S.md }}>
            {packs.map((p, i) => (
              <Card key={p.slug} onPress={() => router.push({ pathname: "/pack/[slug]", params: { slug: p.slug } })} style={{ width: 250, padding: 0, overflow: "hidden", gap: 0 }}>
                <View style={{ height: 88, backgroundColor: [C.moss, C.sand, "#e5e9ec", C.clayTint, "#ece4ea", C.sand][i % 6], padding: S.lg, justifyContent: "space-between" }}>
                  <Ionicons name={p.custom ? "color-palette-outline" : "cube-outline"} size={26} color={C.forestDeep} />
                  {p.rooms > 0 && <T v="caption" color={C.ink2}>{p.rooms} room{p.rooms > 1 ? "s" : ""} · 1 month</T>}
                </View>
                <View style={{ padding: S.lg, gap: 4 }}>
                  <T v="h3">{p.name}</T>
                  <T v="small" numberOfLines={2}>{p.forWhom}</T>
                  <T v="price" color={C.forest} style={{ marginTop: 6 }}>{p.custom ? "On quote" : inr(packTotal(p))}</T>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        <View style={{ gap: S.md, paddingHorizontal: S.xl }}>
          <Section title="Premium picks" action="Shop" onAction={() => router.push("/shop")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.md }}>
              {featured.slice(0, 4).map((p) => (
                <Card key={p.id} onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })} style={{ width: "47.8%", padding: S.sm, gap: 8 }}>
                  <ProductArt category={p.category} size="fill" />
                  <View style={{ paddingHorizontal: 4, paddingBottom: 4, gap: 2 }}>
                    <T v="bodyStrong" numberOfLines={2} style={{ fontSize: 14, lineHeight: 19 }}>{p.name}</T>
                    <T v="price" color={C.forest} style={{ fontSize: 15 }}>{inr(p.price)}</T>
                  </View>
                </Card>
              ))}
            </View>
          </Section>
        </View>

        <View style={{ paddingHorizontal: S.xl }}>
          <T v="small" center>Prices are sample prices and exclude GST.</T>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
