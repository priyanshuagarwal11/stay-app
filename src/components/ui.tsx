import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ComponentProps, type ComponentRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F, R, S, shadow } from "@/constants/theme";
import type { CategoryId, Tier } from "@/data/products";
import { tap } from "@/lib/haptics";
import { useStore } from "@/lib/store";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/* ---------------- Typography ---------------- */
const type = {
  display: { fontFamily: F.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  h1: { fontFamily: F.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  h2: { fontFamily: F.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: F.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: F.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: F.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: F.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: "uppercase" },
  label: { fontFamily: F.semibold, fontSize: 13, lineHeight: 18 },
  price: { fontFamily: F.extrabold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
} satisfies Record<string, TextStyle>;
export type TextVariant = keyof typeof type;

export function T({ v = "body", color, style, children, numberOfLines, center }: { v?: TextVariant; color?: string; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number; center?: boolean }) {
  const defaultColor = v === "small" || v === "caption" ? C.mute : C.ink;
  return (
    <Text numberOfLines={numberOfLines} style={[type[v], { color: color ?? defaultColor }, center && { textAlign: "center" }, style]}>
      {children}
    </Text>
  );
}

/* ---------------- Layout ---------------- */
export function Screen({ children, bottomInset = 0, padded = true, safeTop = false, keyboard = false, contentStyle }: { children: ReactNode; bottomInset?: number; padded?: boolean; safeTop?: boolean; keyboard?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const body = (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[padded && { padding: S.xl }, { paddingBottom: 40 + bottomInset, gap: S.xl, flexGrow: 1 }, contentStyle]}>
      {children}
    </ScrollView>
  );
  const wrapped = keyboard ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );
  return safeTop ? (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.paper }}>
      {wrapped}
    </SafeAreaView>
  ) : (
    wrapped
  );
}

/** Bottom action bar that sits above the home indicator. */
export function StickyBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[st.sticky, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>{children}</View>;
}

export function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <View style={{ gap: S.md }}>
      <View style={st.between}>
        <T v="h2">{title}</T>
        {action && (
          <Pressable hitSlop={8} onPress={onAction}>
            <T v="label" color={C.forest}>{action}</T>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

export const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.lineStrong }} />;

/* ---------------- Surfaces ---------------- */
export function Card({ children, style, onPress, elevated = true, selected }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; elevated?: boolean; selected?: boolean }) {
  const base = [st.card, elevated && shadow(1), selected && st.cardSelected, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [...base, pressed && st.pressed]}>
      {children}
    </Pressable>
  );
}

/* ---------------- Buttons ---------------- */
type BtnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "light" | "ghostLight";
const btnColors: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.forest, fg: C.white },
  secondary: { bg: C.moss, fg: C.forestDeep },
  outline: { bg: C.surface, fg: C.ink, border: C.lineStrong },
  ghost: { bg: "transparent", fg: C.forest },
  danger: { bg: C.dangerTint, fg: C.danger },
  light: { bg: C.white, fg: C.forestDeep },
  ghostLight: { bg: "rgba(255,255,255,0.08)", fg: C.white, border: "rgba(255,255,255,0.35)" },
};

export function Button({ title, onPress, variant = "primary", icon, iconRight, disabled, loading, size = "md", style }: { title: string; onPress: () => void; variant?: BtnVariant; icon?: IconName; iconRight?: IconName; disabled?: boolean; loading?: boolean; size?: "sm" | "md" | "lg"; style?: StyleProp<ViewStyle> }) {
  const c = btnColors[variant];
  const h = size === "lg" ? 56 : size === "sm" ? 38 : 50;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        st.btn,
        { height: h, backgroundColor: c.bg, paddingHorizontal: size === "sm" ? 14 : 20 },
        c.border && { borderWidth: 1, borderColor: c.border },
        variant === "primary" && !off && shadow(2),
        pressed && st.pressed,
        disabled && { opacity: 0.45 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === "sm" ? 16 : 19} color={c.fg} />}
          <Text style={{ fontFamily: F.bold, fontSize: size === "sm" ? 13 : 15, color: c.fg }}>{title}</Text>
          {iconRight && <Ionicons name={iconRight} size={18} color={c.fg} />}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, tone = "light", size = 40, badge }: { icon: IconName; onPress: () => void; label: string; tone?: "light" | "dark" | "plain"; size?: number; badge?: number }) {
  const bg = tone === "dark" ? C.forest : tone === "plain" ? "transparent" : C.surface;
  return (
    <Pressable
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }, tone === "light" && { borderWidth: 1, borderColor: C.line }, pressed && st.pressed]}>
      <Ionicons name={icon} size={size * 0.48} color={tone === "dark" ? C.white : C.ink} />
      {!!badge && (
        <View style={st.dotBadge}>
          <Text style={{ color: C.white, fontFamily: F.bold, fontSize: 10 }}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ---------------- Small pieces ---------------- */
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [st.chip, active && st.chipActive, pressed && st.pressed]}>
      {icon && <Ionicons name={icon} size={14} color={active ? C.white : C.ink2} />}
      <Text style={[st.chipText, active && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

const tierStyle: Record<Tier, { bg: string; fg: string }> = {
  standard: { bg: C.sand, fg: C.ink2 },
  premium: { bg: C.moss, fg: C.forestDeep },
  luxury: { bg: C.clayTint, fg: C.clay },
};
export function TierBadge({ tier }: { tier: Tier }) {
  const s = tierStyle[tier];
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: F.bold, fontSize: 10.5, color: s.fg, textTransform: "capitalize", letterSpacing: 0.3 }}>{tier}</Text>
    </View>
  );
}

export function Qty({ value, min = 1, onChange, compact }: { value: number; min?: number; onChange: (n: number) => void; compact?: boolean }) {
  const sz = compact ? 32 : 40;
  const btn = (icon: IconName, label: string, next: number, disabled: boolean) => (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap();
        onChange(next);
      }}
      style={({ pressed }) => [{ width: sz, height: sz, borderRadius: sz / 2, alignItems: "center", justifyContent: "center", backgroundColor: C.surface }, pressed && st.pressed, disabled && { opacity: 0.35 }]}>
      <Ionicons name={icon} size={compact ? 16 : 18} color={C.ink} />
    </Pressable>
  );
  return (
    <View style={st.qty}>
      {btn("remove", "Decrease", Math.max(min, value - 1), value <= min)}
      <Text style={{ minWidth: compact ? 26 : 34, textAlign: "center", fontFamily: F.bold, fontSize: compact ? 14 : 16, color: C.ink }}>{value}</Text>
      {btn("add", "Increase", value + 1, false)}
    </View>
  );
}

/* ---------------- Forms ---------------- */
export function Field({ label, icon, error, hint, secure, right, ...rest }: { label?: string; icon?: IconName; error?: string | null; hint?: string; secure?: boolean; right?: ReactNode } & TextInputProps) {
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 7 }}>
      {label && <T v="label" color={C.ink2}>{label}</T>}
      <View style={[st.field, focus && st.fieldFocus, !!error && { borderColor: C.danger }, rest.multiline && { height: undefined, minHeight: 92, alignItems: "flex-start", paddingTop: 14 }]}>
        {icon && <Ionicons name={icon} size={19} color={focus ? C.forest : C.faint} />}
        <TextInput
          placeholderTextColor={C.faint}
          secureTextEntry={secure && hidden}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          style={[st.input, rest.multiline && { textAlignVertical: "top" }]}
          {...rest}
        />
        {secure && (
          <Pressable accessibilityLabel={hidden ? "Show password" : "Hide password"} hitSlop={10} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={C.mute} />
          </Pressable>
        )}
        {right}
      </View>
      {error ? (
        <T v="small" color={C.danger}>{error}</T>
      ) : hint ? (
        <T v="small">{hint}</T>
      ) : null}
    </View>
  );
}

/** Six separate boxes for an authenticator code. Fires onComplete when full. */
export function OtpInput({ value, onChange, onComplete, error, autoFocus = true, length = 6 }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: boolean; autoFocus?: boolean; length?: number }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!error) return;
    Animated.sequence(
      [10, -10, 7, -7, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 55, useNativeDriver: Platform.OS !== "web" })),
    ).start();
  }, [error, shake]);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Enter 6-digit code">
      <Animated.View style={{ flexDirection: "row", gap: 10, justifyContent: "center", transform: [{ translateX: shake }] }}>
        {Array.from({ length }, (_, i) => {
          const ch = value[i] ?? "";
          const active = focused && (i === value.length || (i === length - 1 && value.length === length));
          return (
            <View key={i} style={[st.otpBox, ch && { borderColor: C.lineStrong, backgroundColor: C.surface }, active && st.fieldFocus, error && { borderColor: C.danger, backgroundColor: C.dangerTint }]}>
              <Text style={{ fontFamily: F.bold, fontSize: 24, color: C.ink }}>{ch}</Text>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, "").slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        style={st.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

export function Banner({ tone = "error", children, icon }: { tone?: "error" | "info" | "success"; children: ReactNode; icon?: IconName }) {
  const map = {
    error: { bg: C.dangerTint, fg: C.danger, ic: "alert-circle" as IconName },
    info: { bg: C.moss, fg: C.forestDeep, ic: "information-circle" as IconName },
    success: { bg: C.moss, fg: C.success, ic: "checkmark-circle" as IconName },
  }[tone];
  return (
    <View style={{ flexDirection: "row", gap: 10, backgroundColor: map.bg, borderRadius: R.sm, padding: S.md, alignItems: "flex-start" }}>
      <Ionicons name={icon ?? map.ic} size={19} color={map.fg} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 13.5, lineHeight: 19, color: map.fg }}>{children}</Text>
    </View>
  );
}

export function ListRow({ icon, title, subtitle, right, onPress, tone = "default", last }: { icon: IconName; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; tone?: "default" | "danger"; last?: boolean }) {
  const fg = tone === "danger" ? C.danger : C.ink;
  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [st.row, { paddingVertical: 14, paddingHorizontal: S.lg }, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.lineStrong }, pressed && { backgroundColor: C.paper }]}>
      <View style={[st.rowIcon, tone === "danger" && { backgroundColor: C.dangerTint }]}>
        <Ionicons name={icon} size={18} color={tone === "danger" ? C.danger : C.forest} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <T v="bodyStrong" color={fg}>{title}</T>
        {subtitle && <T v="small">{subtitle}</T>}
      </View>
      {right}
      {onPress && <Ionicons name="chevron-forward" size={18} color={C.faint} />}
    </Pressable>
  );
}

export function EmptyState({ icon, title, text, action, onAction }: { icon: IconName; title: string; text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: "center", gap: S.md, paddingVertical: S.xxxl, paddingHorizontal: S.xl }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={38} color={C.forest} />
      </View>
      <T v="h2" center>{title}</T>
      <T v="body" color={C.mute} center>{text}</T>
      {action && onAction && <Button title={action} onPress={onAction} style={{ marginTop: S.sm, alignSelf: "stretch" }} />}
    </View>
  );
}

/* ---------------- Product visuals ---------------- */
const catVisual: Record<CategoryId, { icon: IconName; bg: string; fg: string }> = {
  toiletries: { icon: "water-outline", bg: "#e4ece6", fg: C.forest },
  linen: { icon: "bed-outline", bg: "#efe7da", fg: "#7a5a36" },
  pantry: { icon: "cafe-outline", bg: "#f3e6da", fg: C.clay },
  housekeeping: { icon: "sparkles-outline", bg: "#e5e9ec", fg: "#3e5566" },
  welcome: { icon: "gift-outline", bg: "#ece4ea", fg: "#6f4a63" },
};
export const categoryVisual = (c: CategoryId) => catVisual[c];

export function ProductArt({ category, size = 64, radius, style }: { category: CategoryId; size?: number | "fill"; radius?: number; style?: StyleProp<ViewStyle> }) {
  const v = catVisual[category];
  const fill = size === "fill";
  const px = fill ? 140 : size;
  return (
    <View style={[{ backgroundColor: v.bg, borderRadius: radius ?? (fill ? R.md : Math.max(10, px * 0.24)), alignItems: "center", justifyContent: "center", overflow: "hidden" }, fill ? { width: "100%", aspectRatio: 1.15 } : { width: px, height: px }, style]}>
      <View style={{ position: "absolute", width: px * 0.9, height: px * 0.9, borderRadius: px, backgroundColor: "rgba(255,255,255,0.45)", top: -px * 0.25, right: -px * 0.25 }} />
      <Ionicons name={v.icon} size={px * 0.42} color={v.fg} />
    </View>
  );
}

/* ---------------- Toast ---------------- */
export function Toast() {
  const { toast } = useStore();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (toast) setShown(toast);
    Animated.timing(anim, { toValue: toast ? 1 : 0, duration: 180, useNativeDriver: Platform.OS !== "web" }).start(() => {
      if (!toast) setShown(null);
    });
  }, [toast, anim]);
  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[st.toast, { top: insets.top + 10, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
      <Ionicons name="checkmark-circle" size={18} color="#b9d3bf" />
      <Text style={{ color: C.white, fontFamily: F.semibold, fontSize: 14 }} numberOfLines={1}>{shown}</Text>
    </Animated.View>
  );
}

/* ---------------- Styles ---------------- */
export const st = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: S.lg, gap: S.sm },
  cardSelected: { borderColor: C.forest, borderWidth: 2, backgroundColor: "#f6f9f3" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: R.pill },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  chipActive: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontFamily: F.semibold, fontSize: 13, color: C.ink2 },
  qty: { flexDirection: "row", alignItems: "center", backgroundColor: C.sand, borderRadius: R.pill, padding: 3 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, height: 54, borderWidth: 1.5, borderColor: C.line, borderRadius: R.md, backgroundColor: C.surface, paddingHorizontal: 16 },
  fieldFocus: { borderColor: C.forest, backgroundColor: C.surface },
  input: { flex: 1, fontFamily: F.medium, fontSize: 16, color: C.ink, height: "100%", outlineStyle: "none" } as unknown as TextStyle,
  otpBox: { width: 48, height: 58, borderRadius: R.sm, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.sand, alignItems: "center", justifyContent: "center" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.moss, alignItems: "center", justifyContent: "center" },
  dotBadge: { position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.clay, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: C.paper },
  sticky: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: C.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.lineStrong, paddingHorizontal: S.xl, paddingTop: S.md, gap: S.sm, ...shadow(3) },
  toast: { position: "absolute", alignSelf: "center", flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: C.forestInk, paddingVertical: 12, paddingHorizontal: 18, borderRadius: R.pill, maxWidth: "90%", ...shadow(3) },
  row: { flexDirection: "row", alignItems: "center", gap: S.md },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: S.md },
});
