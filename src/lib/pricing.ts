// Placeholder rules — confirm GST rates and delivery charges before going live.
export const GST_RATE = 0.18;
export const FREE_DELIVERY_FROM = 5000;
export const DELIVERY_FEE = 250;

export function totals(subtotal: number) {
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const gst = Math.round(subtotal * GST_RATE);
  return { delivery, gst, total: subtotal + gst + delivery };
}
