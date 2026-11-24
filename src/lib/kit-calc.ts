import { products, type Product, type Tier } from "@/data/products";

export type KitInputs = {
  rooms: number;
  capacity: number; // total guest capacity
  cycleDays: number; // days the restock should cover
  occupancy: number; // 0-100, assumed average occupancy
  tier: Tier;
};

/** Guest-nights the restock needs to cover. */
export const guestNights = (i: KitInputs) => Math.round(i.capacity * i.cycleDays * (i.occupancy / 100));

/** Units needed for one product. Consumables scale with guest-nights, reusables with par stock. */
export function unitsNeeded(p: Product, i: KitInputs) {
  const u = p.usage;
  let raw = 0;
  if (u.mode === "guest-night") raw = guestNights(i) * u.per;
  else if (u.mode === "room-cycle") raw = i.rooms * u.per * Math.max(1, i.cycleDays / 30);
  else raw = i.capacity * u.per;
  return Math.max(1, Math.ceil(raw));
}

/** Round units up to whole packs, respecting MOQ. */
export function packsFor(p: Product, units: number) {
  return Math.max(p.moq, Math.ceil(units / p.packSize));
}

export const usageNote = (p: Product) =>
  p.usage.mode === "guest-night" ? "Used up per guest-night"
    : p.usage.mode === "room-cycle" ? "Per room each restock"
    : "Reusable stock (par level per guest)";

const rank: Record<Tier, number> = { standard: 0, premium: 1, luxury: 2 };

/** Group -> best matching product for the chosen tier (falls back to nearest available). */
export function defaultSelection(tier: Tier) {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    if (p.category === "welcome" && p.group === "branded") continue;
    groups.set(p.group, [...(groups.get(p.group) ?? []), p]);
  }
  const out: Record<string, Product> = {};
  for (const [g, list] of groups) {
    out[g] = [...list].sort((a, b) => Math.abs(rank[a.tier] - rank[tier]) - Math.abs(rank[b.tier] - rank[tier]))[0];
  }
  return out;
}

export function groupOptions(group: string) {
  return products.filter((p) => p.group === group);
}
