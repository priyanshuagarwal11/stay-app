import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { Button, Card, Chip, Field, Qty, Screen, StickyBar, T, categoryVisual, st, type IconName } from "@/components/ui";
import { C, F, R, S } from "@/constants/theme";
import { categories, unitPrice, type Tier } from "@/data/products";
import { inr } from "@/lib/format";
import { success } from "@/lib/haptics";
import { defaultSelection, groupOptions, guestNights, packsFor, unitsNeeded, type KitInputs } from "@/lib/kit-calc";
import { useStore } from "@/lib/store";

// Same property types, levels and labels as the website's kit builder.
const types: { id: string; d: string; rooms: number; cap: number; icon: IconName }[] = [
  { id: "Airbnb", d: "Entire home or apartment", rooms: 2, cap: 5, icon: "home-outline" },
  { id: "Homestay", d: "Rooms in a family home", rooms: 4, cap: 9, icon: "people-outline" },
  { id: "Boutique Hotel", d: "Small, design-led hotel", rooms: 10, cap: 24, icon: "business-outline" },
  { id: "Serviced Apartment", d: "Longer-stay units", rooms: 6, cap: 14, icon: "key-outline" },
];
const tiers: { id: Tier; d: string; icon: IconName }[] = [
  { id: "standard", d: "Reliable basics, sachets and wrapped soap", icon: "leaf-outline" },
  { id: "premium", d: "Mini bottles and 600 GSM cotton towels", icon: "star-outline" },
  { id: "luxury", d: "Pump dispensers, plush towels, glass bottles", icon: "diamond-outline" },
];
const groupLabel: Record<string, string> = {
  shampoo: "Shampoo", conditioner: "Conditioner", soap: "Soap", bodywash: "Body wash", dental: "Dental kit", vanity: "Vanity kit",
  bathtowel: "Bath towels", handtowel: "Hand towels", bathmat: "Bath mats", slippers: "Slippers",
  tea: "Tea", coffee: "Coffee", sugar: "Sugar", water: "Drinking water",
  cleaner: "All-purpose cleaner", toiletcleaner: "Toilet cleaner", bags: "Garbage bags", freshener: "Room freshener",
  tray: "Welcome tray", card: "Welcome cards",
};
const steps = ["Property", "Details", "Quality", "Your kit"];
const dayOptions = [7, 15, 30, 45, 60];
const occOptions = [30, 50, 60, 70, 85, 100];

function Option({ icon, title, text, selected, onPress }: { icon: IconName; title: string; text: string; selected: boolean; onPress: () => void }) {
  return (
    <Card selected={selected} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: selected ? C.forest : C.moss, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={22} color={selected ? C.white : C.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="h3" style={{ textTransform: "capitalize" }}>{title}</T>
        <T v="small">{text}</T>
      </View>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? C.forest : C.lineStrong} />
    </Card>
  );
}

function StepperRow({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (n: number) => void }) {
  return (
    <View style={[st.between, { paddingVertical: S.md }]}>
      <View style={{ flex: 1 }}>
        <T v="bodyStrong">{label}</T>
        <T v="small">{hint}</T>
      </View>
      <Qty value={value} min={1} onChange={onChange} />
    </View>
  );
}

export default function KitBuilder() {
  const { add, saveKit, notify } = useStore();
  const [step, setStep] = useState(0);
  const [type, setType] = useState("Boutique Hotel");
  const [inp, setInp] = useState<Omit<KitInputs, "tier">>({ rooms: 10, capacity: 24, cycleDays: 30, occupancy: 60 });
  const [tier, setTier] = useState<Tier>("premium");
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("Monthly restock");
  const [saved, setSaved] = useState(false);

  const full: KitInputs = { ...inp, tier };
  const defaults = useMemo(() => defaultSelection(tier), [tier]);
  const lines = useMemo(() => {
    const out = Object.keys(defaults)
      .filter((g) => !off[g])
      .map((g) => {
        const product = groupOptions(g).find((o) => o.id === choice[g]) ?? defaults[g];
        const units = unitsNeeded(product, { ...inp, tier });
        const packs = packsFor(product, units);
        return { group: g, product, units, packs, total: unitPrice(product, packs) * packs };
      });
    const order = categories.map((c) => c.id as string);
    return out.sort((a, b) => order.indexOf(a.product.category) - order.indexOf(b.product.category));
  }, [defaults, choice, off, inp, tier]);
  const total = lines.reduce((s, l) => s + l.total, 0);
  const last = step === steps.length - 1;

  const addToCart = () => {
    lines.forEach((l) => add(l.product.id, l.packs));
    success();
    notify(`${lines.length} items added to cart`);
    router.push("/cart");
  };
  const save = () => {
    saveKit({
      name: name.trim() || "My restock kit",
      note: `${type} · ${inp.rooms} rooms · ${inp.capacity} guests · ${tier}`,
      lines: lines.map((l) => ({ productId: l.product.id, packs: l.packs })),
    });
    success();
    setSaved(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Screen bottomInset={last ? 150 : 90}>
        <View style={{ gap: S.sm }}>
          <View style={st.between}>
            <T v="caption" color={C.forest}>Step {step + 1} of {steps.length}</T>
            <T v="small">{steps[step]}</T>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {steps.map((s, i) => (
              <Pressable key={s} onPress={() => i < step && setStep(i)} style={{ flex: 1, height: 5, borderRadius: R.pill, backgroundColor: i <= step ? C.forest : C.line }} />
            ))}
          </View>
        </View>

        {step === 0 && (
          <View style={{ gap: S.md }}>
            <T v="display" style={{ fontSize: 28 }}>What kind of property do you run?</T>
            <T v="body" color={C.mute}>We'll pre-fill typical room and guest numbers. You can change them next.</T>
            {types.map((t) => (
              <Option key={t.id} icon={t.icon} title={t.id} text={`${t.d} · ~${t.rooms} rooms`} selected={type === t.id} onPress={() => { setType(t.id); setInp({ ...inp, rooms: t.rooms, capacity: t.cap }); }} />
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: S.lg }}>
            <T v="display" style={{ fontSize: 28 }}>Tell us about your {type.toLowerCase()}</T>
            <Card style={{ paddingVertical: S.xs, gap: 0 }}>
              <StepperRow label="Rooms" hint="Rooms you rent out" value={inp.rooms} onChange={(n) => setInp({ ...inp, rooms: n })} />
              <View style={{ height: 1, backgroundColor: C.line }} />
              <StepperRow label="Guest capacity" hint="Total guests when full" value={inp.capacity} onChange={(n) => setInp({ ...inp, capacity: n })} />
            </Card>
            <View style={{ gap: S.sm }}>
              <T v="bodyStrong">Restock should last</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm }}>
                {dayOptions.map((d) => <Chip key={d} label={`${d} days`} active={inp.cycleDays === d} onPress={() => setInp({ ...inp, cycleDays: d })} />)}
              </View>
            </View>
            <View style={{ gap: S.sm }}>
              <T v="bodyStrong">Average occupancy</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: S.sm }}>
                {occOptions.map((o) => <Chip key={o} label={`${o}%`} active={inp.occupancy === o} onPress={() => setInp({ ...inp, occupancy: o })} />)}
              </View>
              <T v="small">Your own estimate. Lower occupancy means fewer consumables.</T>
            </View>
            <Card style={{ backgroundColor: C.moss, borderColor: C.mossDeep, flexDirection: "row", alignItems: "center", gap: S.md }} elevated={false}>
              <Ionicons name="calculator-outline" size={26} color={C.forest} />
              <View style={{ flex: 1 }}>
                <T v="h2" color={C.forestDeep}>{guestNights(full).toLocaleString("en-IN")} guest-nights</T>
                <T v="small" color={C.forestDeep}>{inp.capacity} guests × {inp.cycleDays} days × {inp.occupancy}% full</T>
              </View>
            </Card>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: S.md }}>
            <T v="display" style={{ fontSize: 28 }}>Choose a quality level</T>
            <T v="body" color={C.mute}>You can still swap individual items on the next step.</T>
            {tiers.map((t) => (
              <Option key={t.id} icon={t.icon} title={t.id} text={t.d} selected={tier === t.id} onPress={() => { setTier(t.id); setChoice({}); }} />
            ))}
          </View>
        )}

        {last && (
          <View style={{ gap: S.xl }}>
            <View style={{ gap: S.xs }}>
              <T v="display" style={{ fontSize: 28 }}>Your restock kit</T>
              <T v="body" color={C.mute}>{type} · {inp.rooms} rooms · {guestNights(full).toLocaleString("en-IN")} guest-nights · <T v="body" color={C.mute} style={{ textTransform: "capitalize" }}>{tier}</T></T>
            </View>

            {categories.map((c) => {
              const groups = Object.keys(defaults).filter((g) => defaults[g].category === c.id);
              if (!groups.length) return null;
              const vis = categoryVisual(c.id);
              return (
                <View key={c.id} style={{ gap: S.sm }}>
                  <View style={st.row}>
                    <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: vis.bg, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={vis.icon} size={15} color={vis.fg} />
                    </View>
                    <T v="h3">{c.name}</T>
                  </View>
                  <Card style={{ padding: 0, gap: 0 }}>
                    {groups.map((g, i) => {
                      const line = lines.find((l) => l.group === g);
                      const opts = groupOptions(g);
                      const current = line?.product ?? defaults[g];
                      return (
                        <View key={g} style={[{ padding: S.lg, gap: S.sm }, i < groups.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.line }, off[g] && { opacity: 0.5 }]}>
                          <View style={st.between}>
                            <View style={{ flex: 1 }}>
                              <T v="bodyStrong">{groupLabel[g] ?? g}</T>
                              {line && <T v="small">{line.units.toLocaleString("en-IN")} units → {line.packs} × {line.product.unitLabel}</T>}
                            </View>
                            {line && <T v="bodyStrong">{inr(line.total)}</T>}
                            <Switch value={!off[g]} onValueChange={(on) => setOff({ ...off, [g]: !on })} trackColor={{ true: C.forest, false: C.lineStrong }} thumbColor={C.white} />
                          </View>
                          {opts.length > 1 && !off[g] && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                              {opts.map((o) => (
                                <Pressable key={o.id} onPress={() => setChoice({ ...choice, [g]: o.id })} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.sm, borderWidth: 1, borderColor: current.id === o.id ? C.forest : C.line, backgroundColor: current.id === o.id ? "#f6f9f3" : C.surface }}>
                                  <T v="small" color={current.id === o.id ? C.forestDeep : C.ink2} style={{ fontFamily: current.id === o.id ? F.bold : F.medium, fontSize: 12 }}>{o.name}</T>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </Card>
                </View>
              );
            })}

            <Card style={{ gap: S.md }}>
              <T v="h3">Save this kit</T>
              <T v="small">Saved kits appear in your account so you can reorder next month in one tap.</T>
              <Field icon="bookmark-outline" value={name} onChangeText={(t) => { setName(t); setSaved(false); }} placeholder="Kit name" />
              <Button title={saved ? "Saved to your account" : "Save kit"} variant={saved ? "secondary" : "outline"} icon={saved ? "checkmark" : "bookmark-outline"} disabled={!lines.length || saved} onPress={save} />
            </Card>
          </View>
        )}
      </Screen>

      <StickyBar>
        {last && (
          <View style={st.between}>
            <View>
              <T v="small">Estimated total · {lines.length} items</T>
              <T v="h2">{inr(total)}</T>
            </View>
            <T v="small" style={{ textAlign: "right" }}>≈ {inr(inp.rooms ? total / inp.rooms : 0)}{"\n"}per room</T>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: S.sm }}>
          {step > 0 && <Button title="Back" variant="outline" size="lg" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
          {last ? (
            <Button title="Add kit to cart" icon="bag-add-outline" size="lg" disabled={!lines.length} onPress={addToCart} style={{ flex: 2 }} />
          ) : (
            <Button title="Continue" iconRight="arrow-forward" size="lg" onPress={() => setStep(step + 1)} style={{ flex: 2 }} />
          )}
        </View>
      </StickyBar>
    </View>
  );
}
