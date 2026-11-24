import { Platform } from "react-native";

// StaySupply brand — same palette as the website (globals.css), plus a few UI tints.
export const C = {
  paper: "#faf8f4",
  surface: "#ffffff",
  sand: "#efe9dd",
  sandDeep: "#e2d9c7",
  line: "#ebe4d6",
  lineStrong: "#d9cfbd",
  ink: "#22211d",
  ink2: "#3d3b35",
  mute: "#6b675e",
  faint: "#9a958a",
  forest: "#3b5440",
  forestDeep: "#2b3f2f",
  forestInk: "#1f2e22",
  moss: "#e6ebe0",
  mossDeep: "#d3ddca",
  clay: "#a4612f",
  clayTint: "#f6e9de",
  danger: "#b3402e",
  dangerTint: "#fbeae6",
  success: "#2f7a4b",
  white: "#ffffff",
};

export const F = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
};

export const R = { xs: 8, sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const S = { xxs: 4, xs: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };

export const shadow = (level: 1 | 2 | 3 = 1) =>
  Platform.select({
    web: { boxShadow: ["0 1px 2px rgba(34,33,29,.05)", "0 4px 14px rgba(34,33,29,.07)", "0 12px 32px rgba(34,33,29,.12)"][level - 1] },
    default: {
      shadowColor: "#22211d",
      shadowOpacity: [0.05, 0.08, 0.14][level - 1],
      shadowRadius: [3, 12, 24][level - 1],
      shadowOffset: { width: 0, height: [1, 4, 10][level - 1] },
      elevation: [1, 3, 8][level - 1],
    },
  }) as object;
