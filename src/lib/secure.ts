import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Keychain / Keystore on phones. On web there is no secure store, so we fall back to localStorage.
export async function getSecure(key: string) {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}
export async function setSecure(key: string, value: string | null) {
  if (Platform.OS === "web") {
    try {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } catch {}
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
