//  ShareViewController.swift
//  Daytrip ShareExtension
//
//  Received from the iOS share sheet when a user taps "Daytrip" on a
//  TikTok or Instagram URL. Extracts the URL, opens the main app via
//  the `daytrip://add-clip?url=<encoded>` scheme, and dismisses.
//
//  The main app's AppDelegate forwards the deep link to Capacitor,
//  which fires `appUrlOpen`. The web layer (DeepLinkBridge) catches
//  that and pops the AddClipDialog pre-filled with the URL.

import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        Task { await handleShare() }
    }

    private func handleShare() async {
        guard let extensionContext = self.extensionContext else {
            self.complete()
            return
        }

        var foundUrl: URL? = await Self.extractSharedURL(from: extensionContext.inputItems)

        // Fallbacks: some apps put the URL in plain text.
        if foundUrl == nil {
            for item in extensionContext.inputItems {
                guard let inputItem = item as? NSExtensionItem,
                      let attachments = inputItem.attachments else { continue }
                for attachment in attachments {
                    if attachment.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                        if let text = try? await attachment.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) as? String,
                           let url = Self.extractFirstURL(from: text) {
                            foundUrl = url
                            break
                        }
                    }
                }
                if foundUrl != nil { break }
            }
        }

        guard let url = foundUrl else {
            self.complete()
            return
        }

        // Belt-and-suspenders: stash the URL in the shared App Group so that,
        // if the deep-link path breaks on a future iOS release, the web app
        // can still retrieve the pending URL via a Capacitor plugin read.
        if let shared = UserDefaults(suiteName: Self.appGroup) {
            shared.set(url.absoluteString, forKey: Self.pendingKey)
        }

        await openMainApp(with: url)
        self.complete()
    }

    // MARK: - URL extraction

    private static let appGroup = "group.com.daytrip.shared"
    private static let pendingKey = "pending_clip_url"

    private static func extractSharedURL(from items: [Any]) async -> URL? {
        for item in items {
            guard let inputItem = item as? NSExtensionItem,
                  let attachments = inputItem.attachments else { continue }
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    if let url = try? await attachment.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) as? URL {
                        return url
                    }
                }
            }
        }
        return nil
    }

    private static func extractFirstURL(from text: String) -> URL? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        let match = detector?.firstMatch(in: text, options: [], range: range)
        return match?.url
    }

    // MARK: - Deep link open

    private func openMainApp(with url: URL) async {
        let encoded = url.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? url.absoluteString
        guard let deepLink = URL(string: "daytrip://add-clip?url=\(encoded)") else { return }

        // Walk up the responder chain to reach a UIApplication that supports open(_:).
        // Share Extensions aren't allowed to call UIApplication.shared directly, so this
        // hunt-for-open pattern is the documented workaround.
        var responder: UIResponder? = self
        while let current = responder {
            if let application = current as? UIApplication {
                await application.open(deepLink, options: [:])
                return
            }
            if NSStringFromClass(type(of: current)) == "UIApplication",
               let selector = Selector(("openURL:")) as Selector?,
               current.responds(to: selector) {
                _ = current.perform(selector, with: deepLink)
                return
            }
            responder = current.next
        }
    }

    private func complete() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
