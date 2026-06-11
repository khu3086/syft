# Publishing Syft to the app stores

Syft is a PWA, so the store apps are thin native shells that load your hosted site.
Two scaffolds are already in the repo — you only fill in two values each.

Prerequisite: the website is deployed and you know your domain
(`https://<app>.up.railway.app`).

---

## Android → Google Play (Trusted Web Activity)

The easiest path. Uses [`public/.well-known/assetlinks.json`](public/.well-known/assetlinks.json).

1. Go to **PWABuilder** → https://www.pwabuilder.com → enter your domain → **Start**.
2. **Package For Stores → Android → Google Play** → **Generate**. Download the zip — it
   contains a signed **`.aab`** and the app's **SHA-256 signing fingerprint**.
3. Open [`public/.well-known/assetlinks.json`](public/.well-known/assetlinks.json) and replace:
   - `REPLACE_WITH_YOUR_PLAY_APP_SIGNING_SHA256_FINGERPRINT` → the fingerprint from step 2
   - `com.syft.app` → your chosen package name (must match what you used in PWABuilder)
4. Redeploy (`railway up`) so the file is live at
   `https://<app>.up.railway.app/.well-known/assetlinks.json` — this is what verifies the app
   owns the domain (so Android hides the browser URL bar).
5. Create the app in **Play Console** → https://play.google.com/console → upload the `.aab`.

Docs: https://docs.pwabuilder.com/#/builder/android · https://developer.android.com/training/app-links/verify-android-applinks

---

## iOS → App Store (Capacitor)

Apple won't accept a raw PWA, so wrap the live site with **Capacitor**. Uses
[`capacitor.config.json`](capacitor.config.json). Requires a **Mac with Xcode**.

1. Edit [`capacitor.config.json`](capacitor.config.json) → set `server.url` to your real
   domain (replace `REPLACE-WITH-YOUR-DOMAIN.up.railway.app`).
2. Install Capacitor and add the iOS platform:
   ```bash
   pnpm add @capacitor/core @capacitor/cli @capacitor/ios
   pnpm dlx cap add ios
   pnpm dlx cap sync ios
   pnpm dlx cap open ios     # opens Xcode
   ```
3. In Xcode: set your signing **Team**, then **Product → Archive → Distribute App** to upload
   to **App Store Connect** → https://appstoreconnect.apple.com.

Accounts: Apple Developer Program ($99/yr) → https://developer.apple.com/programs/ ·
Capacitor iOS docs → https://capacitorjs.com/docs/ios

> The same `capacitor.config.json` also works for an iOS-side Android build if you ever want
> Capacitor (instead of TWA) for Android: `pnpm dlx cap add android`.

---

### Notes
- Because both wrappers load the **hosted** site (`server.url`), app updates ship the moment
  you redeploy the website — no new store submission needed for web changes (only for native
  shell changes).
- Keep `com.syft.app` consistent across PWABuilder, `assetlinks.json`, and `capacitor.config.json`.
