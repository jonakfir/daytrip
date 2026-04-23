#!/usr/bin/env ruby
# Adds the Daytrip Share Extension target to the Xcode project.
#
# What this does:
#   - Creates a new "ShareExtension" app-extension target
#   - Wires the three source/config files into it (already on disk under
#     mobile/ios/App/ShareExtension/)
#   - Links UIKit / Social / UniformTypeIdentifiers frameworks
#   - Adds an "Embed App Extensions" build phase on the main App target
#   - Writes App.entitlements and ShareExtension.entitlements with the
#     shared App Group and wires them into build configs
#   - Sets bundle IDs, iOS deployment target, Swift version
#
# What this doesn't do (you still need Xcode GUI for):
#   - Signing: the Apple Developer team ID must be set in Xcode > Signing
#     & Capabilities. That requires signing in with your Apple ID and,
#     the first time, registering the App Group on the developer portal.
#   - Building + running on a device or simulator.
#
# Safe to re-run — checks for an existing ShareExtension target first.

require "xcodeproj"
require "fileutils"

PROJECT_PATH    = File.expand_path("../mobile/ios/App/App.xcodeproj", __dir__)
APP_ROOT        = File.expand_path("../mobile/ios/App", __dir__)
EXT_DIR         = File.join(APP_ROOT, "ShareExtension")
APP_DIR         = File.join(APP_ROOT, "App")
APP_GROUP_ID    = "group.com.daytrip.shared"
EXT_BUNDLE_ID   = "com.daytrip.app.share"
DEPLOYMENT      = "15.0"

abort "Project not found: #{PROJECT_PATH}" unless File.exist?(PROJECT_PATH)
abort "Extension sources not found: #{EXT_DIR}" unless Dir.exist?(EXT_DIR)

project = Xcodeproj::Project.open(PROJECT_PATH)

app_target = project.targets.find { |t| t.name == "App" }
abort "Couldn't find App target — is this the right project?" unless app_target

# ─── Entitlements files ────────────────────────────────────────────────────

app_ent_path = File.join(APP_DIR, "App.entitlements")
ext_ent_path = File.join(EXT_DIR, "ShareExtension.entitlements")

[[app_ent_path, "App"], [ext_ent_path, "ShareExtension"]].each do |path, _label|
  next if File.exist?(path)
  File.write(path, <<~XML)
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>com.apple.security.application-groups</key>
        <array>
            <string>#{APP_GROUP_ID}</string>
        </array>
    </dict>
    </plist>
  XML
  puts "wrote #{path}"
end

# ─── Existing-target check (idempotent) ────────────────────────────────────

ext_target = project.targets.find { |t| t.name == "ShareExtension" }

if ext_target.nil?
  puts "creating ShareExtension target…"
  ext_target = project.new_target(:app_extension, "ShareExtension", :ios, DEPLOYMENT, nil, :swift)
  ext_target.build_configuration_list.build_configurations.each do |config|
    settings = config.build_settings
    settings["PRODUCT_BUNDLE_IDENTIFIER"]        = EXT_BUNDLE_ID
    settings["PRODUCT_NAME"]                     = "$(TARGET_NAME)"
    settings["INFOPLIST_FILE"]                   = "ShareExtension/Info.plist"
    settings["CODE_SIGN_ENTITLEMENTS"]           = "ShareExtension/ShareExtension.entitlements"
    settings["SWIFT_VERSION"]                    = "5.0"
    settings["IPHONEOS_DEPLOYMENT_TARGET"]       = DEPLOYMENT
    settings["TARGETED_DEVICE_FAMILY"]           = "1,2"
    settings["LD_RUNPATH_SEARCH_PATHS"]          = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"
    settings["SKIP_INSTALL"]                     = "YES"
    settings["CODE_SIGN_STYLE"]                  = "Automatic"
    # Don't lock a team id here — the user sets it once in Xcode and it
    # propagates to both targets via the project-level setting.
  end
else
  puts "ShareExtension target already exists — syncing files only."
end

# ─── File references ───────────────────────────────────────────────────────

ext_group = project.main_group.find_subpath("ShareExtension", true)
ext_group.set_source_tree("<group>")
ext_group.set_path("ShareExtension")

def ensure_ref(group, path_on_disk, last_known_file_type)
  filename = File.basename(path_on_disk)
  existing = group.files.find { |f| f.path == filename || f.path == path_on_disk }
  return existing if existing
  ref = group.new_reference(filename)
  ref.last_known_file_type = last_known_file_type
  ref
end

swift_ref      = ensure_ref(ext_group, "ShareViewController.swift", "sourcecode.swift")
plist_ref      = ensure_ref(ext_group, "Info.plist",                "text.plist.xml")
storyboard_ref = ensure_ref(ext_group, "MainInterface.storyboard",  "file.storyboard")
ent_ext_ref    = ensure_ref(ext_group, "ShareExtension.entitlements", "text.plist.entitlements")

# Also add App.entitlements to the App group if not already there
app_group_ref = project.main_group.find_subpath("App", true)
ent_app_ref   = app_group_ref.files.find { |f| f.path == "App.entitlements" }
if ent_app_ref.nil?
  ent_app_ref = app_group_ref.new_reference("App.entitlements")
  ent_app_ref.last_known_file_type = "text.plist.entitlements"
end

# Source file → Sources build phase
ext_target.source_build_phase.add_file_reference(swift_ref, true) unless ext_target.source_build_phase.files_references.include?(swift_ref)

# Storyboard → Resources build phase
ext_target.resources_build_phase.add_file_reference(storyboard_ref, true) unless ext_target.resources_build_phase.files_references.include?(storyboard_ref)

# ─── Frameworks ────────────────────────────────────────────────────────────

%w[UIKit.framework Social.framework UniformTypeIdentifiers.framework].each do |fw|
  next if ext_target.frameworks_build_phase.files_references.any? { |r| r.path&.end_with?(fw) }
  frameworks_group = project.frameworks_group
  ref = frameworks_group.files.find { |f| f.path&.end_with?(fw) }
  if ref.nil?
    ref = frameworks_group.new_file("System/Library/Frameworks/#{fw}", :sdk_root)
  end
  ext_target.frameworks_build_phase.add_file_reference(ref, true)
end

# ─── Configure App target: entitlements + Embed App Extensions phase ───────

app_target.build_configuration_list.build_configurations.each do |config|
  config.build_settings["CODE_SIGN_ENTITLEMENTS"] = "App/App.entitlements"
end

# Embed App Extensions: PBXCopyFilesBuildPhase with dstSubfolderSpec = 13 (plugins)
embed_phase = app_target.build_phases.find do |phase|
  phase.is_a?(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase) && phase.name == "Embed App Extensions"
end
if embed_phase.nil?
  embed_phase = app_target.new_copy_files_build_phase("Embed App Extensions")
  embed_phase.symbol_dst_subfolder_spec = :plug_ins
  puts "added Embed App Extensions build phase on App target"
end

# Product reference of the extension (its built .appex)
appex_product = ext_target.product_reference
unless embed_phase.files_references.include?(appex_product)
  embed_file = embed_phase.add_file_reference(appex_product, true)
  embed_file.settings = { "ATTRIBUTES" => ["RemoveHeadersOnCopy"] }
end

# Main App target depends on ShareExtension so it builds first
unless app_target.dependencies.any? { |d| d.target == ext_target }
  app_target.add_dependency(ext_target)
end

project.save
puts "saved #{PROJECT_PATH}"

# ─── Summary ───────────────────────────────────────────────────────────────

puts ""
puts "Done. Still needed (Xcode GUI):"
puts "  1. Open #{APP_ROOT}/App.xcworkspace"
puts "  2. Select App target > Signing & Capabilities > set your Team"
puts "  3. Select ShareExtension target > Signing & Capabilities > set the same Team"
puts "  4. First build may prompt Apple to register the App Group \"#{APP_GROUP_ID}\""
puts "  5. Run on a device or simulator."
