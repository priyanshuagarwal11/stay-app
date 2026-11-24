# StaySupply — mobile app + API

React Native app (Expo) for StaySupply, with sign-in and two-step verification using an authenticator app, plus a small Node.js API in `server/`.

## Run it (two terminals)

You need Node.js 20+ on your Mac and the **Expo Go** app on your phone.

**Terminal 1 — the server**
```bash
cd ~/Desktop/"stay app"
npm run server:install   # first time only
npm run server           # starts the API on port 4000
```
Without a MongoDB URL it stores accounts in `server/data/dev-db.json` so you can try it straight away.
To use MongoDB, copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`, `JWT_SECRET` and `TOTP_ENC_KEY`.

**Terminal 2 — the app**
```bash
cd ~/Desktop/"stay app"
npm install              # first time only
npx expo start
```
Scan the QR code with Expo Go (same Wi-Fi as the Mac). The app finds the server on your Mac automatically.
If it can't connect, check the Mac firewall allows Node on port 4000, or set `EXPO_PUBLIC_API_URL` (see `.env.example`).

## Sign-in and authenticator

1. **Create account** — name, property, email, password (min 8 chars, letters + a number).
2. **Account → Authenticator app → Set up.** Scan the QR code, or on the same phone tap *Open in authenticator app* / copy the setup key. Works with Google Authenticator, Microsoft Authenticator, Authy, 1Password.
3. Enter the 6-digit code → you get **8 backup codes** (each works once). Save them.
4. From then on, signing in asks for your password **and** a code. Lost your phone? Use a backup code.
5. You can get new backup codes or turn the authenticator off (needs password + code).

How it's secured:
- Passwords hashed with bcrypt (12 rounds); login errors don't reveal whether an email exists.
- Authenticator secrets are encrypted in the database (AES-256-GCM); backup codes stored only as hashes.
- A used code can't be replayed; codes allow ±30 s clock drift.
- After the password step the server issues a 5-minute token that can only be used to submit the code.
- Rate limits on sign-in and code entry. The app keeps the session token in the phone's secure keychain (Expo SecureStore).

## Tech

| Part | What we use |
|---|---|
| App | React Native 0.88, **Expo SDK 58**, TypeScript |
| Navigation | **Expo Router** — tabs + stack, `Stack.Protected` guards signed-in screens |
| Design | Plus Jakarta Sans + Fraunces (same fonts as the website), brand colours in `src/constants/theme.ts` |
| Session storage | `expo-secure-store` (keychain); cart/kits/orders per account in AsyncStorage |
| Extras | `expo-linear-gradient`, `expo-haptics`, `expo-clipboard`, Ionicons |
| API | Node.js, **Express 5**, **MongoDB** (Mongoose), JWT, `otplib` (TOTP), `qrcode`, `zod`, `helmet`, rate limiting |

## Folder map

```
src/
  app/
    _layout.tsx            fonts, splash, auth guard, store
    (auth)/                welcome, sign-in, sign-up, verify (2FA code)
    (tabs)/                Home, Shop, Kit Builder, Cart, Account
    product/[slug].tsx     product page with sticky add-to-cart
    pack/[slug].tsx        ready-made pack
    checkout.tsx           delivery details (pre-filled from profile)
    profile.tsx            edit business profile
    security/              authenticator setup/manage, change password
  components/ui.tsx        design system: text, buttons, fields, OTP input, cards…
  lib/                     api.ts, auth.tsx, store.tsx, kit-calc.ts, pricing.ts…
  data/                    products.ts, kits.ts (same as website)
server/
  src/                     Express app, auth routes, TOTP, storage (MongoDB or dev file)
  test/auth.test.js        end-to-end test of sign-up → 2FA → sign-in (`npm test`)
```

## Not done yet

- Payments, real order storage on the server, and email verification / password reset (needs an email service).
- GST (18%) and delivery (free above ₹5,000, else ₹250) in `src/lib/pricing.ts` are placeholders.
- Prices are sample prices from the website data. App icon/splash image are still Expo defaults.
