import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === "web") return;
  fn().catch(() => {});
};
export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warn = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
