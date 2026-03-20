---
module: Mobile
date: 2026-03-19
problem_type: workflow_issue
component: development_workflow
symptoms:
  - 'Podfile modified directly but changes lost on next prebuild/native regeneration'
  - 'Expo plugin config.ts updated but dist/ not rebuilt, so changes not applied'
  - 'MMKV pod pinned to master in Podfile instead of through Expo config plugin'
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: high
tags: [expo, podfile, native-generation, expo-plugins, build-step, ios, mobile]
---

# Direct Native File Edits in Expo Project

## Problem

During an upgrade of `react-native-quick-crypto` and `react-native-mmkv`, the iOS `Podfile` was modified directly to:

1. Remove a `pod 'MMKV'` line
2. Add a `post_install` block with `MMKV_IOS_EXTENSION` preprocessor macro
3. Change the MMKV pod version pin

These changes were made to the generated `apps/mobile/ios/Podfile` rather than through the Expo config plugin that generates it (`expo-plugins/notification-service-ios`).

Additionally, when the Expo plugin source (`plugin/config.ts`) was correctly updated, the build step (`yarn build` in the plugin directory) was not run, so the compiled output in `dist/` was stale and the changes were not applied during the next prebuild.

## Root Cause

Two workflow gaps:

1. **Expo continuously regenerates native files.** The `ios/` and `android/` directories are generated artifacts in an Expo managed/custom dev client workflow. Direct edits to `Podfile`, `AppDelegate`, `Info.plist`, etc. will be overwritten on the next `expo prebuild`. All native configuration must flow through Expo config plugins or `app.config.ts`.

2. **Expo plugins with a build step require compilation.** The `notification-service-ios` plugin has a TypeScript source in `plugin/` and compiled output in `dist/`. The `app.plugin.js` entry point loads from `dist/`. Editing `plugin/config.ts` without running `yarn build` (or the plugin's build script) means the changes never reach the compiled output that Expo actually reads.

## Solution

### Rule 1: Never directly edit generated native files

- `apps/mobile/ios/Podfile` - generated, edit via Expo plugins
- `apps/mobile/ios/*.pbxproj` - generated, edit via Expo plugins
- `apps/mobile/android/build.gradle` - generated, edit via Expo plugins

Instead, modify the Expo config plugin that generates the content:

```
# The Podfile content for the notification extension is templated here:
expo-plugins/notification-service-ios/plugin/config.ts  # PODFILE_MODIF_NEEDED constant

# NOT here:
apps/mobile/ios/Podfile  # This is a generated output
```

### Rule 2: Always run the plugin build step after editing plugin source

```bash
# After editing any file in expo-plugins/notification-service-ios/plugin/
cd expo-plugins/notification-service-ios
yarn build  # Compiles TS and copies ios-notification-service-files/ to dist/

# Then regenerate native project
cd apps/mobile
npx expo prebuild --clean  # Regenerates ios/ and android/ from plugins
```

The build script from `package.json`:

```json
"build": "rm -rf dist && tsc && cp -a ./ios-notification-service-files dist/ios-notification-service-files/"
```

This copies both the compiled TypeScript AND the Swift/plist template files into `dist/`.

## Prevention

Before modifying any native iOS/Android file in an Expo project:

1. **Ask: "Is this file generated?"** If it's under `ios/` or `android/`, it almost certainly is.
2. **Find the config plugin** that generates or modifies it. Search `expo-plugins/` and `app.config.ts`.
3. **Edit the plugin source**, not the generated output.
4. **Run the plugin build step** if the plugin has one (`yarn build`).
5. **Run `expo prebuild`** to verify changes are applied correctly.

## Related

- `expo-plugins/notification-service-ios/` - The Expo plugin for iOS notification service extension
- `apps/mobile/ios/Podfile` - Generated Podfile (do not edit directly)
