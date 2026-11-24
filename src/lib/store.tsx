import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { productById, unitPrice } from "@/data/products";

export type CartLine = { productId: string; packs: number };
export type SavedKit = { id: string; name: string; note: string; lines: CartLine[] };
export type Order = { id: string; date: string; property: string; total: number; items: number };

type Ctx = {
  ready: boolean;
  cart: CartLine[];
  count: number;
  subtotal: number;
  add: (productId: string, packs?: number) => void;
  setPacks: (productId: string, packs: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  kits: SavedKit[];
  saveKit: (k: Omit<SavedKit, "id">) => void;
  deleteKit: (id: string) => void;
  orders: Order[];
  placeOrder: (property: string, total: number) => Order | null;
  toast: string | null;
  notify: (m: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);
const KEY = "staysupply.app.v1";  // + user id, so each account has its own cart

export const lineTotal = (l: CartLine) => {
  const p = productById(l.productId);
  return p ? unitPrice(p, l.packs) * l.packs : 0;
};

export function StoreProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [kits, setKits] = useState<SavedKit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load saved data from the phone once on start.
  useEffect(() => {
    AsyncStorage.getItem(`${KEY}.${userId}`)
      .then((raw) => {
        if (!raw) return;
        const d = JSON.parse(raw);
        setCart(d.cart ?? []);
        setKits(d.kits ?? []);
        setOrders(d.orders ?? []);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [userId]);

  // Save whenever something changes.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(`${KEY}.${userId}`, JSON.stringify({ cart, kits, orders })).catch(() => {});
  }, [cart, kits, orders, ready, userId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((m: string) => setToast(m), []);

  const add = useCallback((productId: string, packs?: number) => {
    const p = productById(productId);
    if (!p) return;
    const n = Math.max(packs ?? p.moq, p.moq);
    setCart((c) => {
      const f = c.find((l) => l.productId === productId);
      return f
        ? c.map((l) => (l.productId === productId ? { ...l, packs: l.packs + n } : l))
        : [...c, { productId, packs: n }];
    });
    setToast(`Added ${p.name}`);
  }, []);

  const setPacks = useCallback((productId: string, packs: number) => {
    const p = productById(productId);
    if (!p) return;
    setCart((c) => c.map((l) => (l.productId === productId ? { ...l, packs: Math.max(p.moq, packs) } : l)));
  }, []);

  const remove = useCallback((productId: string) => setCart((c) => c.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setCart([]), []);

  const saveKit = useCallback((k: Omit<SavedKit, "id">) => {
    setKits((ks) => [...ks, { ...k, id: `k${Date.now()}` }]);
    setToast("Kit saved");
  }, []);
  const deleteKit = useCallback((id: string) => setKits((ks) => ks.filter((k) => k.id !== id)), []);

  const value = useMemo<Ctx>(() => {
    const count = cart.reduce((s, l) => s + l.packs, 0);
    const subtotal = cart.reduce((s, l) => s + lineTotal(l), 0);
    const placeOrder = (property: string, total: number) => {
      if (cart.length === 0) return null;
      const o: Order = {
        id: `SS-${1000 + orders.length + 1}`,
        date: new Date().toISOString().slice(0, 10),
        property,
        total,
        items: cart.length,
      };
      setOrders((os) => [o, ...os]);
      setCart([]);
      return o;
    };
    return { ready, cart, count, subtotal, add, setPacks, remove, clear, kits, saveKit, deleteKit, orders, placeOrder, toast, notify };
  }, [ready, cart, add, setPacks, remove, clear, kits, saveKit, deleteKit, orders, toast, notify]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
