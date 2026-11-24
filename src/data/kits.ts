import { productBySlug } from "./products";

export type Pack = {
  slug: string;
  name: string;
  forWhom: string;
  rooms: number; // reference size the quantities are written for
  blurb: string;
  items: { slug: string; qty: number }[]; // product slug + quantity (units)
  custom?: boolean;
};

export const packs: Pack[] = [
  {
    slug: "starter-pack",
    name: "Starter Pack",
    forWhom: "Single-room homestays and first-time hosts",
    rooms: 1,
    blurb: "The bare essentials for one room for a month.",
    items: [
      { slug: "shampoo-sachet-10ml", qty: 100 },
      { slug: "soap-bar-15g-wrapped", qty: 100 },
      { slug: "dental-kit", qty: 100 },
      { slug: "bath-towel-450-gsm", qty: 6 },
      { slug: "tea-sachet-assortment", qty: 100 },
    ],
  },
  {
    slug: "airbnb-essentials-pack",
    name: "Airbnb Essentials Pack",
    forWhom: "Airbnb hosts with 1-3 units",
    rooms: 2,
    blurb: "Covers toiletries, towels and a pantry basics set for short stays.",
    items: [
      { slug: "shampoo-sachet-10ml", qty: 200 },
      { slug: "conditioner-sachet-10ml", qty: 100 },
      { slug: "soap-bar-15g-wrapped", qty: 100 },
      { slug: "bath-towel-450-gsm", qty: 8 },
      { slug: "hand-towel-400-gsm", qty: 6 },
      { slug: "bath-mat-900-gsm", qty: 4 },
      { slug: "instant-coffee-sachet-2g", qty: 100 },
      { slug: "tea-sachet-assortment", qty: 100 },
      { slug: "sugar-sachet-5g", qty: 200 },
    ],
  },
  {
    slug: "premium-pack",
    name: "Premium Pack",
    forWhom: "Well-rated homestays and serviced apartments",
    rooms: 3,
    blurb: "Mini-bottle toiletries and heavier cotton towels.",
    items: [
      { slug: "shampoo-bottle-30ml", qty: 100 },
      { slug: "conditioner-bottle-30ml", qty: 50 },
      { slug: "glycerin-soap-bar-30g", qty: 50 },
      { slug: "dental-kit", qty: 100 },
      { slug: "bath-towel-600-gsm-cotton", qty: 12 },
      { slug: "hand-towel-400-gsm", qty: 8 },
      { slug: "terry-cloth-slippers", qty: 25 },
      { slug: "bamboo-welcome-tray", qty: 3 },
    ],
  },
  {
    slug: "boutique-hotel-pack",
    name: "Boutique Hotel Pack",
    forWhom: "Boutique hotels with 8-12 rooms",
    rooms: 10,
    blurb: "A full monthly restock for a small hotel floor.",
    items: [
      { slug: "shampoo-bottle-30ml", qty: 300 },
      { slug: "conditioner-bottle-30ml", qty: 150 },
      { slug: "body-wash-bottle-30ml", qty: 150 },
      { slug: "glycerin-soap-bar-30g", qty: 150 },
      { slug: "dental-kit", qty: 200 },
      { slug: "bath-towel-600-gsm-cotton", qty: 30 },
      { slug: "hand-towel-400-gsm", qty: 20 },
      { slug: "bath-mat-900-gsm", qty: 10 },
      { slug: "terry-cloth-slippers", qty: 75 },
      { slug: "garbage-bags-30l", qty: 150 },
      { slug: "all-purpose-cleaner-5l", qty: 2 },
    ],
  },
  {
    slug: "luxury-pack",
    name: "Luxury Pack",
    forWhom: "Premium villas and upscale boutique stays",
    rooms: 5,
    blurb: "Pump dispensers, plush towels, glass bottles and welcome trays.",
    items: [
      { slug: "shampoo-pump-dispenser-300ml", qty: 5 },
      { slug: "glycerin-soap-bar-30g", qty: 100 },
      { slug: "bath-towel-700-gsm-egyptian-style", qty: 20 },
      { slug: "hand-towel-400-gsm", qty: 12 },
      { slug: "terry-cloth-slippers", qty: 50 },
      { slug: "glass-water-bottle-500ml", qty: 24 },
      { slug: "bamboo-welcome-tray", qty: 5 },
    ],
  },
  {
    slug: "custom-branded-pack",
    name: "Custom Branded Pack",
    forWhom: "Properties that want their own logo and packaging",
    rooms: 0,
    custom: true,
    blurb: "Priced per quotation after we review your branding and quantities.",
    items: [{ slug: "custom-branded-amenity-set", qty: 50 }],
  },
];

export function packLines(pack: Pack) {
  return pack.items
    .map((it) => {
      const product = productBySlug(it.slug);
      if (!product) return null;
      const packs = Math.ceil(it.qty / product.packSize);
      return { product, qty: it.qty, packs, total: packs * product.price };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export const packTotal = (pack: Pack) => packLines(pack).reduce((s, l) => s + l.total, 0);
