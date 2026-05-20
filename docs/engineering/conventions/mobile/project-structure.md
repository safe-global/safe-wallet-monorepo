# Mobile Project Structure

Use this before making changes under `apps/mobile/` or to mobile-only
shared files. Read the repo-wide conventions in
[../project-structure.md](../project-structure.md) first.

## Entry Point And Provider Tree

The mobile app entry is `apps/mobile/src/app/_layout.tsx` (Expo Router).
Place AppKit / store / data providers here so screens have safe
context. Network-aware providers (anything that needs to read
`activeSafe`, chain config, or RTK Query state) belong below the Redux
Provider so they can read store state.
Wallet/provider integrations should derive supported networks and
initialization options from app config/store state where possible,
rather than a hardcoded subset that can drift from the config service.

Expo Router `_layout.tsx` files should stay structural: screen stacks,
headers, and provider placement. Business cleanup, disconnects,
validation, and navigation side effects belong in a flow container,
screen component, or dedicated hook.

When a context provider needs the active Safe to set extra info
(`addUserExtraInfo({ safeAddress, chainId })` for Datadog RUM, etc.),
pair the write with a reset for when `activeSafe` becomes null —
otherwise subsequent events are mis-tagged with the previous Safe.

## UI Conventions

Mobile UI uses Tamagui. Use Tamagui spacing tokens (`$2`, `$4`, `$8`,
etc.) and color tokens (`$background`, `$success`, `$color`,
`$backgroundSheet`, etc.) instead of magic numbers and hex literals.
The exception is `borderRadius: 100` / `150` for circular clipping
where the theme has no large-enough token; document the reason
inline.

Bottom insets (iPhone home indicator, Android gesture nav) must be
applied at exactly one level. If a parent
(`BottomSheetFooter`, sheet container) already offsets by
`bottomInset`, do not re-add `paddingBottom: insets.bottom` to its
child — the inset double-applies and pushes critical actions out of
reach.

Container components that wrap `children` in `Button.Text` (or any
text node) must keep non-string children outside the text wrapper.
`<SafeButton><ActivityIndicator/></SafeButton>` renders nothing if the
container blindly nests element children inside `Button.Text`.

Hidden tabs / animated views with `opacity: 0` still participate in
hit testing in React Native — gate `pointerEvents` (or unmount
inactive nodes) when a tab is not active, otherwise hidden tab
actions remain tappable.

## Theming

Mobile theme follows the OS appearance. The user's "auto" theme
selection must pass `null` to `Appearance.setColorScheme` — calling it
with a resolved `'light'` / `'dark'` value disables the
OS-follows-system behavior because `useColorScheme()` then reads the
override.

If `useColorScheme()` returns `'unspecified'` on some startup paths,
normalize it to a concrete theme value before passing into
`TamaguiProvider`'s `defaultTheme`; Tamagui only knows about light
and dark.

## Expo SDK Configuration

Expo SDK config lives in `apps/mobile/app.config.ts`. To meet Play
Store API requirements, raise `targetSdkVersion` and
`compileSdkVersion`. Raising `minSdkVersion` is a device-coverage
decision (it drops older Android versions entirely) and should be
made deliberately, not as the default knob for Play requirements.

EAS profiles in `apps/mobile/eas.json`: when bumping the shared `base`
profile's Node version or Android image, verify the dependent profiles
(e.g. `build-and-maestro-test`) `extends: base` rather than carrying
their own pinned Node / image version that drifts from CI.

## RTK Query And Refetch

RTK Query and Redux usage matches the repo-wide conventions
(see [../project-structure.md](../project-structure.md)).

Mobile-specific gotcha: some upstream hooks type `refetch` as
synchronous `() => void`. Awaiting such a `refetch()` returns
immediately, so a pull-to-refresh spinner that hides on `await` looks
like a broken refresh. If you need "spinner until data back", wrap
the underlying query and re-trigger via arg change rather than
relying on a synchronous `refetch`.

## Assets

Mobile assets (wallet icons, etc.) live in `apps/mobile/assets/`. Host
images on `apps.safe.global` rather than embedding base64 blobs in
source — base64 inflates the bundle permanently and disables caching.

## Mobile Testing

Mobile unit tests use Jest + React Native Testing Library. When
testing async flows (signer ownership validation, network calls
during navigation), set a `cancelled`/`isMounted` flag inside the
effect to bail on stale resolutions; tests should cover both the
in-flight unmount path and the success path.

Avoid mutable mock objects (`mockIsConnected = { current: true }`) in
tests — they leak state across tests. Return immutable mocks per test
case.
