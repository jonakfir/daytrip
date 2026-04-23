# iOS Share Extension — setup

The Xcode target, build phases, entitlements, file references, and
Embed-App-Extensions wiring are all automated by
[`scripts/ios-add-share-extension.rb`](../scripts/ios-add-share-extension.rb). It's already been run
once during the Phase 5 commit. Re-run it any time by doing:

```bash
gem install --user-install xcodeproj     # one-time
ruby scripts/ios-add-share-extension.rb  # idempotent; safe to re-run
```

The script also writes `mobile/ios/App/App/App.entitlements` and
`mobile/ios/App/ShareExtension/ShareExtension.entitlements`, each with
the `group.com.daytrip.shared` App Group claim.

After the script runs the project builds structurally (`xcodebuild -list`
shows both `App` and `ShareExtension` schemes). **Signing** is the only
remaining step — and it requires you in Xcode because it touches your
Apple ID.

---

## Manual step: signing

1. `npm install` inside `mobile/` (pulls `@capacitor/app` into the right
   node_modules so Xcode SPM resolution works).
2. Open the project:

   ```bash
   open mobile/ios/App/App.xcodeproj
   ```

3. In the left sidebar, click the **App** project, then in the middle pane:
   - Select the **App** target → **Signing & Capabilities** tab.
   - Set your **Team** (your Apple Developer account).
   - Confirm **App Groups** shows `group.com.daytrip.shared` (already
     wired via entitlements — you may need to click the refresh arrow
     next to it if Xcode didn't auto-pick it up).
4. Repeat for the **ShareExtension** target — same Team, same App Group.
5. Xcode will offer to register the App Group with Apple on your
   behalf on first build. Accept.

## Run

Plug in a device (the iOS Simulator doesn't show third-party share
extensions by default, so device is the real test) and hit Run. The
share-sheet test:

1. Safari → share → "Daytrip" → should launch the app on the AddClipDialog
   with the URL pre-filled.
2. TikTok → share → "Daytrip" → same.
3. Instagram → share a reel → same.

If "Daytrip" doesn't appear in the share sheet, tap **More** at the end
of the row and toggle it on.

---

## What the script did (for reference)

1. Created a `ShareExtension` app-extension target (product type
   `com.apple.product-type.app-extension`).
2. Linked the existing on-disk files to the target:
   - `mobile/ios/App/ShareExtension/ShareViewController.swift` → Sources
   - `mobile/ios/App/ShareExtension/MainInterface.storyboard` → Resources
   - `mobile/ios/App/ShareExtension/Info.plist` → INFOPLIST_FILE setting
3. Added `UIKit`, `Social`, and `UniformTypeIdentifiers` to the extension's
   Frameworks build phase.
4. Added an **Embed App Extensions** (`PBXCopyFilesBuildPhase` with
   `dstSubfolderSpec = plug_ins`) build phase on the main App target,
   referencing the extension's `.appex` product.
5. Made the App target depend on the ShareExtension target so it builds
   first.
6. Wrote `App.entitlements` and `ShareExtension.entitlements` with the
   `com.apple.security.application-groups` claim, wired via
   `CODE_SIGN_ENTITLEMENTS` build setting on both targets.

## What it didn't touch

- Signing team (must be your Apple ID).
- Apple Developer portal App Group registration (Xcode handles on first
  build, after you set the team).
- Running or distributing the build.

## Android

Deferred. Android's share flow uses `Intent` filters in
`AndroidManifest.xml` — a separate short doc when we add that platform.
