import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, T, type IconName } from "@/components/ui";
import { C, F, S } from "@/constants/theme";

const points: { icon: IconName; t: string }[] = [
  { icon: "cube-outline", t: "Toiletries, linen, pantry and housekeeping in one order" },
  { icon: "calculator-outline", t: "Kit builder works out exact monthly quantities" },
  { icon: "repeat-outline", t: "Save your kit and reorder in one tap" },
];

/** Decorative arches, echoing the website's pattern. */
function Arches() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", right: -40, top: 40, flexDirection: "row", gap: 14, opacity: 0.16 }}>
      {[150, 190, 130].map((h, i) => (
        <View key={i} style={{ width: 92, height: h + 120, borderTopLeftRadius: 46, borderTopRightRadius: 46, borderWidth: 2, borderColor: C.white, marginTop: 60 - i * 30 }} />
      ))}
    </View>
  );
}

export default function Welcome() {
  return (
    <LinearGradient colors={[C.forest, C.forestDeep, C.forestInk]} style={{ flex: 1 }}>
      <Arches />
      <SafeAreaView style={{ flex: 1, padding: S.xxl, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: S.md }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="leaf" size={20} color={C.forest} />
          </View>
          <T v="h3" color={C.white} style={{ fontFamily: F.extrabold, fontSize: 18 }}>StaySupply</T>
        </View>

        <View style={{ gap: S.xl }}>
          <T v="caption" color="#c7d6c9">For hotels, homestays & Airbnbs</T>
          <T v="display" color={C.white} style={{ fontSize: 40, lineHeight: 46 }}>
            Everything a guest room needs, in one order.
          </T>
          <View style={{ gap: S.md }}>
            {points.map((p) => (
              <View key={p.t} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={p.icon} size={18} color={C.white} />
                </View>
                <T v="body" color="#e3ebe4" style={{ flex: 1 }}>{p.t}</T>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: S.md }}>
          <Button title="Create a business account" variant="light" size="lg" onPress={() => router.push("/sign-up")} />
          <Button title="I already have an account" variant="ghostLight" size="lg" onPress={() => router.push("/sign-in")} />
          <T v="small" color="#a9bdac" center>Built in Jaipur for Indian hospitality businesses</T>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
