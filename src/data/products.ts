export type CategoryId = "toiletries" | "linen" | "pantry" | "housekeeping" | "welcome";
export type Tier = "standard" | "premium" | "luxury";

export type Usage =
  | { mode: "guest-night"; per: number } // consumed per guest per night
  | { mode: "room-cycle"; per: number } // consumed per room per restock cycle
  | { mode: "par-guest"; per: number }; // reusable par stock per guest capacity

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  subs: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  sub: string;
  group: string; // interchangeable item family used by the kit builder
  tier: Tier;
  price: number; // INR per unit (sample pricing)
  unitLabel: string;
  packSize: number; // units per orderable pack
  moq: number; // minimum order quantity in packs
  bulk: { min: number; price: number }[];
  stock: number;
  sku: string;
  material: string;
  short: string;
  specs: [string, string][];
  usage: Usage;
};

export const categories: Category[] = [
  { id: "toiletries", name: "Toiletries", blurb: "Shampoo, conditioner, soap and dental kits", subs: ["Hair care", "Soap & body", "Dental & vanity"] },
  { id: "linen", name: "Bath & Linen", blurb: "Towels, slippers and bath mats", subs: ["Towels", "Slippers", "Mats"] },
  { id: "pantry", name: "Pantry", blurb: "Tea, coffee, sugar and guest water", subs: ["Beverages", "Condiments", "Water"] },
  { id: "housekeeping", name: "Housekeeping", blurb: "Cleaning and room-maintenance essentials", subs: ["Cleaners", "Consumables"] },
  { id: "welcome", name: "Welcome Kits", blurb: "Ready-made and branded welcome items", subs: ["Trays & cards", "Branded"] },
];

type Seed = Omit<Product, "id" | "slug" | "sku" | "bulk" | "moq" | "stock"> & { moq?: number; stock?: number; bulkPct?: [number, number] };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function make(seed: Seed, i: number): Product {
  const { bulkPct = [6, 12], moq = 1, stock = 120 + ((i * 37) % 400), ...rest } = seed;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    ...rest,
    id: `p${String(i + 1).padStart(3, "0")}`,
    slug: slugify(seed.name),
    sku: `SS-${seed.category.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
    moq,
    stock,
    bulk: [
      { min: 10, price: round(seed.price * (1 - bulkPct[0] / 100)) },
      { min: 25, price: round(seed.price * (1 - bulkPct[1] / 100)) },
    ],
  };
}

const seeds: Seed[] = [
  // Toiletries
  { name: "Shampoo Sachet 10ml", category: "toiletries", sub: "Hair care", group: "shampoo", tier: "standard", price: 380, unitLabel: "pack of 100", packSize: 100, material: "Mild sulphate-free formula", short: "Everyday single-use shampoo sachets.", specs: [["Volume", "10 ml each"], ["Pack", "100 sachets"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Shampoo Bottle 30ml", category: "toiletries", sub: "Hair care", group: "shampoo", tier: "premium", price: 1450, unitLabel: "pack of 50", packSize: 50, material: "PET bottle, flip cap", short: "Mini bottle with a more premium in-room feel.", specs: [["Volume", "30 ml each"], ["Pack", "50 bottles"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Shampoo Pump Dispenser 300ml", category: "toiletries", sub: "Hair care", group: "shampoo", tier: "luxury", price: 420, unitLabel: "each", packSize: 1, material: "Frosted bottle, steel-finish pump", short: "Wall-mount or counter refill-friendly dispenser.", specs: [["Volume", "300 ml"], ["Finish", "Frosted"]], usage: { mode: "room-cycle", per: 1 } },
  { name: "Conditioner Sachet 10ml", category: "toiletries", sub: "Hair care", group: "conditioner", tier: "standard", price: 420, unitLabel: "pack of 100", packSize: 100, material: "Smoothing formula", short: "Single-use conditioner sachets.", specs: [["Volume", "10 ml each"], ["Pack", "100 sachets"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Conditioner Bottle 30ml", category: "toiletries", sub: "Hair care", group: "conditioner", tier: "premium", price: 1550, unitLabel: "pack of 50", packSize: 50, material: "PET bottle, flip cap", short: "Mini conditioner bottle.", specs: [["Volume", "30 ml each"], ["Pack", "50 bottles"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Soap Bar 15g Wrapped", category: "toiletries", sub: "Soap & body", group: "soap", tier: "standard", price: 520, unitLabel: "pack of 100", packSize: 100, material: "Paper-wrapped bar", short: "Individually wrapped guest soap.", specs: [["Weight", "15 g each"], ["Pack", "100 bars"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Glycerin Soap Bar 30g", category: "toiletries", sub: "Soap & body", group: "soap", tier: "premium", price: 1180, unitLabel: "pack of 50", packSize: 50, material: "Glycerin base, carton box", short: "Gentler glycerin soap in a printed carton.", specs: [["Weight", "30 g each"], ["Pack", "50 bars"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Body Wash Bottle 30ml", category: "toiletries", sub: "Soap & body", group: "bodywash", tier: "premium", price: 1480, unitLabel: "pack of 50", packSize: 50, material: "PET bottle, flip cap", short: "Mini shower gel bottle.", specs: [["Volume", "30 ml each"], ["Pack", "50 bottles"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Dental Kit", category: "toiletries", sub: "Dental & vanity", group: "dental", tier: "standard", price: 1250, unitLabel: "pack of 100", packSize: 100, material: "Toothbrush + paste sachet", short: "Compact toothbrush and paste kit.", specs: [["Contents", "Brush + 3 g paste"], ["Pack", "100 kits"]], usage: { mode: "guest-night", per: 0.5 } },
  { name: "Vanity Kit (Comb, Cotton, Shower Cap)", category: "toiletries", sub: "Dental & vanity", group: "vanity", tier: "standard", price: 1100, unitLabel: "pack of 100", packSize: 100, material: "Paper pouch", short: "Comb, cotton buds and shower cap pouch.", specs: [["Contents", "3 items"], ["Pack", "100 kits"]], usage: { mode: "guest-night", per: 0.5 } },
  // Linen
  { name: "Bath Towel 450 GSM", category: "linen", sub: "Towels", group: "bathtowel", tier: "standard", price: 320, unitLabel: "each", packSize: 1, moq: 6, material: "Cotton blend", short: "Durable everyday bath towel.", specs: [["Weight", "450 GSM"], ["Size", "60 x 120 cm"]], usage: { mode: "par-guest", per: 3 } },
  { name: "Bath Towel 600 GSM Cotton", category: "linen", sub: "Towels", group: "bathtowel", tier: "premium", price: 560, unitLabel: "each", packSize: 1, moq: 6, material: "100% cotton", short: "Soft, absorbent cotton towel.", specs: [["Weight", "600 GSM"], ["Size", "70 x 140 cm"]], usage: { mode: "par-guest", per: 3 } },
  { name: "Bath Towel 700 GSM Egyptian-style", category: "linen", sub: "Towels", group: "bathtowel", tier: "luxury", price: 840, unitLabel: "each", packSize: 1, moq: 6, material: "Long-staple cotton", short: "Heavy, plush towel for premium rooms.", specs: [["Weight", "700 GSM"], ["Size", "70 x 140 cm"]], usage: { mode: "par-guest", per: 3 } },
  { name: "Hand Towel 400 GSM", category: "linen", sub: "Towels", group: "handtowel", tier: "standard", price: 140, unitLabel: "each", packSize: 1, moq: 6, material: "Cotton blend", short: "Hand towel for washbasin.", specs: [["Weight", "400 GSM"], ["Size", "40 x 60 cm"]], usage: { mode: "par-guest", per: 2 } },
  { name: "Bath Mat 900 GSM", category: "linen", sub: "Mats", group: "bathmat", tier: "standard", price: 260, unitLabel: "each", packSize: 1, moq: 4, material: "Cotton terry", short: "Absorbent floor mat.", specs: [["Weight", "900 GSM"], ["Size", "50 x 75 cm"]], usage: { mode: "par-guest", per: 0.5 } },
  { name: "Disposable Slippers EVA", category: "linen", sub: "Slippers", group: "slippers", tier: "standard", price: 1400, unitLabel: "pack of 50 pairs", packSize: 50, material: "EVA sole, cotton-blend top", short: "Single-use guest slippers.", specs: [["Size", "Free size"], ["Pack", "50 pairs"]], usage: { mode: "guest-night", per: 0.5 } },
  { name: "Terry Cloth Slippers", category: "linen", sub: "Slippers", group: "slippers", tier: "premium", price: 2600, unitLabel: "pack of 25 pairs", packSize: 25, material: "Terry top, non-slip sole", short: "Soft slippers guests can take home.", specs: [["Size", "Free size"], ["Pack", "25 pairs"]], usage: { mode: "guest-night", per: 0.5 } },
  // Pantry
  { name: "Tea Sachet Assortment", category: "pantry", sub: "Beverages", group: "tea", tier: "standard", price: 480, unitLabel: "box of 100", packSize: 100, material: "Assam CTC + green", short: "Mixed tea sachets.", specs: [["Pack", "100 sachets"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Instant Coffee Sachet 2g", category: "pantry", sub: "Beverages", group: "coffee", tier: "standard", price: 420, unitLabel: "box of 100", packSize: 100, material: "Instant coffee", short: "Single-serve coffee sachets.", specs: [["Weight", "2 g each"], ["Pack", "100 sachets"]], usage: { mode: "guest-night", per: 1 } },
  { name: "Sugar Sachet 5g", category: "pantry", sub: "Condiments", group: "sugar", tier: "standard", price: 190, unitLabel: "box of 200", packSize: 200, material: "Refined sugar", short: "Sugar sachets for tea and coffee.", specs: [["Weight", "5 g each"], ["Pack", "200 sachets"]], usage: { mode: "guest-night", per: 2 } },
  { name: "Drinking Water 250ml", category: "pantry", sub: "Water", group: "water", tier: "standard", price: 360, unitLabel: "case of 24", packSize: 24, moq: 2, material: "PET bottle", short: "Packaged drinking water.", specs: [["Volume", "250 ml each"], ["Pack", "24 bottles"]], usage: { mode: "guest-night", per: 2 } },
  { name: "Glass Water Bottle 500ml", category: "pantry", sub: "Water", group: "water", tier: "luxury", price: 190, unitLabel: "each", packSize: 1, moq: 12, material: "Glass with cap", short: "Reusable in-room glass bottle.", specs: [["Volume", "500 ml"]], usage: { mode: "room-cycle", per: 2 } },
  // Housekeeping
  { name: "All-purpose Cleaner 5L", category: "housekeeping", sub: "Cleaners", group: "cleaner", tier: "standard", price: 780, unitLabel: "each", packSize: 1, material: "Concentrate", short: "Surface cleaner for rooms and bathrooms.", specs: [["Volume", "5 L"]], usage: { mode: "room-cycle", per: 0.1 } },
  { name: "Toilet Cleaner 1L", category: "housekeeping", sub: "Cleaners", group: "toiletcleaner", tier: "standard", price: 130, unitLabel: "each", packSize: 1, material: "Acid-based", short: "Bathroom bowl cleaner.", specs: [["Volume", "1 L"]], usage: { mode: "room-cycle", per: 0.5 } },
  { name: "Garbage Bags 30L", category: "housekeeping", sub: "Consumables", group: "bags", tier: "standard", price: 340, unitLabel: "roll of 30", packSize: 30, material: "Biodegradable-blend film", short: "Bin liners for rooms.", specs: [["Capacity", "30 L"], ["Pack", "30 bags"]], usage: { mode: "room-cycle", per: 15 } },
  { name: "Room Freshener 300ml", category: "housekeeping", sub: "Consumables", group: "freshener", tier: "standard", price: 210, unitLabel: "each", packSize: 1, material: "Aerosol", short: "Fragrance spray for rooms.", specs: [["Volume", "300 ml"]], usage: { mode: "room-cycle", per: 0.25 } },
  // Welcome
  { name: "Bamboo Welcome Tray", category: "welcome", sub: "Trays & cards", group: "tray", tier: "premium", price: 690, unitLabel: "each", packSize: 1, moq: 4, material: "Natural bamboo", short: "Tray for tea, coffee and amenities.", specs: [["Size", "30 x 20 cm"]], usage: { mode: "room-cycle", per: 1 } },
  { name: "Welcome Card Set", category: "welcome", sub: "Trays & cards", group: "card", tier: "standard", price: 450, unitLabel: "pack of 50", packSize: 50, material: "300 GSM card", short: "Plain cards you can hand-write.", specs: [["Size", "A6"], ["Pack", "50 cards"]], usage: { mode: "guest-night", per: 0.2 } },
  { name: "Custom Branded Amenity Set", category: "welcome", sub: "Branded", group: "branded", tier: "luxury", price: 2850, unitLabel: "pack of 50 (quote)", packSize: 50, moq: 4, material: "Your logo on box and labels", short: "Logo, packaging and contents tailored to your property. Final price by quotation.", specs: [["Branding", "Logo on box/label"], ["Lead time", "Confirmed on quotation"]], usage: { mode: "room-cycle", per: 1 } },
];

export const products: Product[] = seeds.map(make);

export const productById = (id: string) => products.find((p) => p.id === id);
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;

export function unitPrice(p: Product, qty: number) {
  const tier = [...p.bulk].reverse().find((b) => qty >= b.min);
  return tier ? tier.price : p.price;
}
