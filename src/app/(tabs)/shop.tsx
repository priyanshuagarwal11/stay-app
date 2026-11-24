import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Chip, EmptyState, ProductArt, T, TierBadge, st } from "@/components/ui";
import { C, F, R, S, shadow } from "@/constants/theme";
import { packs, packTotal } from "@/data/kits";
import { categories, products, type CategoryId, type Product, type Tier } from "@/data/products";
import { inr } from "@/lib/format";
import { tap } from "@/lib/haptics";
import { useStore } from "@/lib/store";

const tiers: Tier[] = ["standard", "premium", "luxury"];

function ProductTile({ p }: { p: Product }) {
  const { add, cart } = useStore();
  const inCart = cart.some((l) => l.productId === p.id);
  return (
    <Card onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })} style={{ flex: 1, padding: S.sm, gap: 8 }}>
      <View>
        <ProductArt category={p.category} size="fill" />
        <View style={{ position: "absolute", top: 8, left: 8 }}>
          <TierBadge tier={p.tier} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 4, gap: 2, flex: 1 }}>
        <T v="bodyStrong" numberOfLines={2} style={{ fontSize: 14, lineHeight: 19 }}>{p.name}</T>
        <T v="small" numberOfLines={1} style={{ fontSize: 12 }}>{p.unitLabel}</T>
      </View>
      <View style={[st.between, { paddingHorizontal: 4, paddingBottom: 2 }]}>
        <T v="price" color={C.ink} style={{ fontSize: 15.5 }}>{inr(p.price)}</T>
        <Pressable
          accessibilityLabel={`Add ${p.name} to cart`}
          hitSlop={6}
          onPress={() => {
            tap();
            add(p.id);
          }}
          style={({ pressed }) => [{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: inCart ? C.moss : C.forest }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Ionicons name={inCart ? "checkmark" : "add"} size={20} color={inCart ? C.forest : C.white} />
        </Pressable>
      </View>
    </Card>
  );
}

export default function Shop() {
  const params = useLocalSearchParams<{ cat?: string; view?: string; focus?: string }>();
  const [view, setView] = useState<"products" | "packs">("products");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (params.cat && categories.some((c) => c.id === params.cat)) {
      setCat(params.cat as CategoryId);
      setView("products");
    }
  }, [params.cat]);
  useEffect(() => {
    if (params.view === "packs") setView("packs");
  }, [params.view]);

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "all" || p.category === cat) &&
          (tier === "all" || p.tier === tier) &&
          (!q || `${p.name} ${p.sub} ${p.short}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [cat, tier, q],
  );

  const header = (
    <View style={{ gap: S.lg, paddingBottom: S.sm }}>
      <T v="h1">Shop</T>
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderRadius: R.pill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 18 }, shadow(1)]}>
        <Ionicons name="search" size={19} color={C.faint} />
        <TextInput
          placeholder="Search products"
          placeholderTextColor={C.faint}
          value={q}
          autoFocus={params.focus === "1"}
          onChangeText={(t) => {
            setQ(t);
            if (t) setView("products");
          }}
          style={[st.input, { fontSize: 15 }]}
          returnKeyType="search"
        />
        {!!q && (
          <Pressable onPress={() => setQ("")} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={19} color={C.faint} />
          </Pressable>
        )}
      </View>
      {/* Segmented control */}
      <View style={{ flexDirection: "row", backgroundColor: C.sand, borderRadius: R.pill, padding: 4 }}>
        {(["products", "packs"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => {
              tap();
              setView(v);
            }}
            style={[{ flex: 1, height: 38, borderRadius: R.pill, alignItems: "center", justifyContent: "center" }, view === v && [{ backgroundColor: C.surface }, shadow(1)]]}>
            <T v="label" color={view === v ? C.ink : C.mute} style={{ fontFamily: F.bold }}>{v === "products" ? `Products · ${products.length}` : `Packs · ${packs.length}`}</T>
          </Pressable>
        ))}
      </View>
      {view === "products" && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }} style={{ marginHorizontal: -S.xl }} contentInset={{ left: S.xl }}>
            <View style={{ width: S.xl - S.sm }} />
            <Chip label="All" active={cat === "all"} onPress={() => setCat("all")} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={cat === c.id} onPress={() => setCat(c.id)} />
            ))}
            <View style={{ width: S.xl - S.sm }} />
          </ScrollView>
          <View style={st.between}>
            <T v="small" numberOfLines={1} style={{ flexShrink: 1 }}>{list.length} found</T>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["all", ...tiers] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => {
                    tap();
                    setTier(t);
                  }}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill, backgroundColor: tier === t ? C.moss : "transparent" }}>
                  <T v="small" color={tier === t ? C.forestDeep : C.mute} style={{ fontFamily: F.semibold, fontSize: 12, textTransform: "capitalize" }}>{t === "all" ? "Any" : t}</T>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.paper }}>
      {view === "products" ? (
        <FlatList
          key="grid"
          data={list}
          numColumns={2}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: S.xl, paddingTop: S.md, gap: S.md, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: S.md }}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState icon="search-outline" title="No matches" text="Try a different word, category or quality level." action="Clear filters" onAction={() => { setQ(""); setCat("all"); setTier("all"); }} />}
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, maxWidth: "50%" }} key={index}>
              <ProductTile p={item} />
            </View>
          )}
        />
      ) : (
        <FlatList
          key="packs"
          data={packs}
          keyExtractor={(p) => p.slug}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: S.xl, paddingTop: S.md, gap: S.md, paddingBottom: 40 }}
          ListHeaderComponent={header}
          renderItem={({ item: p }) => (
            <Card onPress={() => router.push({ pathname: "/pack/[slug]", params: { slug: p.slug } })} style={{ flexDirection: "row", gap: S.md, alignItems: "center" }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={p.custom ? "color-palette-outline" : "cube-outline"} size={26} color={C.forest} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="h3">{p.name}</T>
                <T v="small" numberOfLines={2}>{p.forWhom}</T>
                <T v="small" color={C.ink2} style={{ fontFamily: F.semibold }}>{p.items.length} products{p.rooms > 0 ? ` · ${p.rooms} room${p.rooms > 1 ? "s" : ""}` : ""}</T>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <T v="price" color={C.forest} style={{ fontSize: 15 }}>{p.custom ? "Quote" : inr(packTotal(p))}</T>
                <Ionicons name="chevron-forward" size={18} color={C.faint} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
