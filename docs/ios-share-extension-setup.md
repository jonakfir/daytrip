# iOS Share Extension — manual Xcode setup

The Swift source files live in `mobile/ios/App/ShareExtension/`. Swift code
can't be fully automated into an Xcode project — you need to add the target
yourself once, then everything after that is `npx cap sync ios` and rebuilds.

Budget: ~20 minutes the first time.

---

## 1. Install `@capacitor/app` (if not already)

The DeepLinkBridge uses Capacitor's App plugin for `appUrlOpen` events.

```bash
npm install @capacitor/app
npx cap sync ios
```

## 2. Open the Xcode workspace

```bash
open mobile/ios/App/App.xcworkspace
```

## 3. Add a Share Extension target

1. File → New → Target → **Share Extension**.
2. Name: `ShareExtension`. Language: **Swift**. Click Finish.
3. When prompted "Activate the ShareExtension scheme?" → **Don't activate** (we still want to run the main app).

Xcode creates `mobile/ios/App/ShareExtension/` with a default
`ShareViewController.swift`, `Info.plist`, and `MainInterface.storyboard`.

## 4. Replace the generated files with ours

From a terminal at the repo root:

```bash
# The files we committed overwrite Xcode's generated stubs.
cp mobile/ios/App/ShareExtension/ShareViewController.swift \
   mobile/ios/App/ShareExtension/ShareViewController.swift.ours
# (After cp, re-drag the *.ours file back into Xcode's project navigator
# if Xcode doesn't pick it up automatically. Easier: delete the stub in
# Xcode, then re-add with "Add files to App…")
```

Easier Xcode-native workflow:

- Delete the stub `ShareViewController.swift`, `Info.plist`, and `MainInterface.storyboard` that Xcode created for the target.
- Drag the files from `mobile/ios/App/ShareExtension/` (Finder) into the ShareExtension group in Xcode. Check "Copy items if needed: **OFF**" and "Add to target: **ShareExtension**".

## 5. App Group (for the belt-and-suspenders stash)

Both targets (main App + ShareExtension) need an App Group so the extension
can stash the pending URL in shared `UserDefaults`.

1. Select the main **App** target → **Signing & Capabilities** → "+ Capability" → **App Groups**.
2. Add a group: `group.com.daytrip.shared`.
3. Repeat for the **ShareExtension** target. Check the same `group.com.daytrip.shared` box.

(Both apps must sign into the same Apple developer team for App Groups to work.)

## 6. URL scheme registration — already done

`mobile/ios/App/App/Info.plist` already declares `CFBundleURLSchemes = ["daytrip"]`. No action needed.

## 7. Build settings for the ShareExtension target

- **Deployment target:** match the main app (iOS 15+ recommended — we use Swift concurrency).
- **iOS Deployment Target → 15.0** (or later).

## 8. Run

1. Pick **App** scheme in Xcode → run on device or simulator.
2. In Safari / TikTok / Instagram, share a URL → "Daytrip" should appear in the share sheet.
3. Tap it. The app opens on whatever page you were on and pops the **Add clip** dialog with the URL pre-filled.

If the share sheet doesn't show "Daytrip":
- Enable it via the "More" option at the end of the share row → toggle "Daytrip" on.
- Confirm the ShareExtension target's **Activation Rule** matches (it should, we pre-set it).

## 9. QA checklist

- [ ] Share a TikTok URL from the TikTok app → Daytrip opens on AddClipDialog with URL.
- [ ] Share an Instagram reel URL → same behaviour.
- [ ] Share a non-TikTok/IG URL (e.g., a YouTube link) → extension opens the app but the AddClipDialog rejects with "unsupported platform". (Expected until Phase 7.)
- [ ] Cold start: kill the app, then share from TikTok → app launches and the dialog opens. This validates the localStorage-fallback path.
- [ ] User not logged in: share → lands on login → after login, pending URL replays.

## Future: Android share target

Deferred per the feature plan. Android uses `Intent` filters in
`AndroidManifest.xml` — a separate short doc when we get there.
