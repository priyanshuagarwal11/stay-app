import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Banner, Button, Card, EmptyState, Field, Screen, StickyBar, T, st } from "@/components/ui";
import { C, S } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/format";
import { success } from "@/lib/haptics";
import { totals } from "@/lib/pricing";
import { useStore, type Order } from "@/lib/store";

export default function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, placeOrder } = useStore();
  const [f, setF] = useState({ property: user?.property ?? "", contact: user?.name ?? "", phone: user?.phone ?? "", address: "", city: "Jaipur", pin: "" });
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const t = totals(subtotal);
  const on = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const err = {
    property: !f.property.trim() ? "Enter the property name." : null,
    contact: !f.contact.trim() ? "Enter a contact person." : null,
    phone: f.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit mobile number." : null,
    address: f.address.trim().length < 6 ? "Enter the full address." : null,
    pin: /^\d{6}$/.test(f.pin) ? null : "6 digits.",
  };
  const valid = !Object.values(err).some(Boolean);

  if (done)
    return (
      <Screen>
        <View style={{ alignItems: "center", gap: S.lg, paddingTop: S.xxxl }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="checkmark" size={52} color={C.forest} />
          </View>
          <T v="display" center>Order placed</T>
          <T v="body" color={C.mute} center>Order {done.id} for {done.property} · {inr(done.total)}</T>
          <Banner tone="info">This is a demo order. No payment was taken and nothing has been sent to a supplier yet.</Banner>
          <Button title="View my orders" size="lg" onPress={() => router.replace("/account")} style={{ alignSelf: "stretch" }} />
          <Button title="Keep shopping" variant="ghost" onPress={() => router.replace("/shop")} />
        </View>
      </Screen>
    );

  if (cart.length === 0)
    return <Screen><EmptyState icon="bag-handle-outline" title="Your cart is empty" text="Add something before checking out." action="Browse products" onAction={() => router.replace("/shop")} /></Screen>;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Screen keyboard bottomInset={130}>
        <View style={{ gap: S.lg }}>
          <T v="h2">Delivery details</T>
          <Field label="Property name" icon="business-outline" value={f.property} onChangeText={on("property")} placeholder="e.g. Haveli Homestay" error={touched ? err.property : null} />
          <Field label="Contact person" icon="person-outline" value={f.contact} onChangeText={on("contact")} error={touched ? err.contact : null} />
          <Field label="Mobile" icon="call-outline" value={f.phone} onChangeText={on("phone")} keyboardType="phone-pad" placeholder="10-digit number" error={touched ? err.phone : null} />
          <Field label="Address" icon="location-outline" value={f.address} onChangeText={on("address")} multiline placeholder="Building, street, area" error={touched ? err.address : null} />
          <View style={{ flexDirection: "row", gap: S.md }}>
            <View style={{ flex: 1 }}><Field label="City" value={f.city} onChangeText={on("city")} /></View>
            <View style={{ flex: 1 }}><Field label="PIN code" value={f.pin} onChangeText={on("pin")} keyboardType="number-pad" maxLength={6} error={touched ? err.pin : null} /></View>
          </View>
        </View>

        <View style={{ gap: S.md }}>
          <T v="h2">Payment</T>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: S.md }}>
            <Ionicons name="card-outline" size={22} color={C.mute} />
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">Online payment coming soon</T>
              <T v="small">For now, orders are saved on this phone only.</T>
            </View>
          </Card>
        </View>

        <Card>
          <View style={st.between}><T v="body" color={C.mute}>{cart.length} products</T><T v="bodyStrong">{inr(subtotal)}</T></View>
          <View style={st.between}><T v="body" color={C.mute}>GST</T><T v="bodyStrong">{inr(t.gst)}</T></View>
          <View style={st.between}><T v="body" color={C.mute}>Delivery</T><T v="bodyStrong">{t.delivery ? inr(t.delivery) : "Free"}</T></View>
        </Card>
      </Screen>

      <StickyBar>
        <View style={st.between}>
          <T v="small">To pay</T>
          <T v="h2">{inr(t.total)}</T>
        </View>
        <Button
          title="Place order"
          icon="lock-closed-outline"
          size="lg"
          onPress={() => {
            setTouched(true);
            if (!valid) return;
            const o = placeOrder(f.property.trim(), t.total);
            if (o) {
              success();
              setDone(o);
            }
          }}
        />
      </StickyBar>
    </View>
  );
}
