# WalletConnect dApps — pairing & session approval (E2E)

Maestro coverage for the WalletConnect dApp pairing-and-approval entry point
(scanner, deep-link route, proposal sheet). Real relay pairing is too flaky for
Maestro — the timing of `session_proposal` arrival depends on a live relay and an
external dApp — so these flows drive a deterministic fake WalletKit.

## How it works

Maestro cannot call app-side JS (its `runScript` runs in a separate GraalJS
sandbox), so every scenario is driven by tapping hidden `TestCtrls` buttons and
typing into test-only inputs. Two mechanisms back this:

1. **Fake WalletKit** — `src/features/WalletConnect/Wallet/walletKit.e2e.ts` is
   swapped in by Metro (`RN_SRC_EXT=e2e.ts`). It replaces relay calls (`pair`,
   `approveSession`, `rejectSession`) with deterministic behaviour driven by
   `walletKitE2eState`. Real app-side handler/approval/rejection logic still runs.
2. **Event synthesis** — `session_proposal` / `session_request` / `session_delete`
   are NOT emitted through the SDK; the setup helpers in
   `src/tests/e2e-maestro/setup/walletConnectDappsSetup.ts` dispatch fixture
   payloads straight into `walletKitSlice`. `RequestSheetHost` renders them.

The `NATIVE_WALLETCONNECT` feature flag is force-enabled in E2E
(`useHasFeature.e2e.ts`, armed via `walletKitE2eState.forceNativeWalletConnect`)
so the surface doesn't depend on remote chains config.

## Deviations from the ticket (WA-2324)

- **No camera scan.** Maestro can't drive the simulator camera, so the scanner is
  exercised via a test-only injector (`E2eScanInjector.e2e.tsx`) that feeds a
  typed `wc:` URI into the real `onScan` handler. The spinner / error overlay /
  try-again paths are the real scanner UI.
- **Timeout semantics.** `pair-scan-timeout` relies on the scanner's
  `PAIR_TIMEOUT_MS` timer, which wraps the `pair()` call — not "proposal arrival".
  The fake `pair()` hangs (`pairBehavior: 'hang'`) so the timer fires.
- **Synthesis over runScript.** The ticket described a `runScript`-accessible
  global; that isn't feasible (sandbox isolation). TestCtrls taps drive synthesis
  instead, mirroring the connect-signer (WA-1858) pattern.

## iOS accessibility gotchas (why flows anchor on testIDs)

Learned while getting these green on a real simulator:

- **`@gorhom/bottom-sheet` hides its children by default.** Its container defaults
  to `accessible={true}`, collapsing the whole sheet into one iOS accessibility
  element — Maestro sees `"Bottom Sheet"` but none of its descendants. Fixed by
  `accessible={false}` on the `BottomSheetModal` in `RequestSheetHost` (matching
  the repo's other sheets). Without it, nothing inside the proposal sheet is
  queryable.
- **Grouped overlays merge their text into one label.** The scanner's
  error/connecting overlays expose a single merged `accessibilityText` (e.g.
  `"Unrecognised QR code, Try again"`), so matching the bare message string fails.
  Anchor on the button testID (`wc-scan-try-again`) instead.
- **Rule of thumb:** assert on `testID`s (Views, Buttons, RN primitives all map to
  `resource-id` reliably), not on visible text. The spinner copy (`Connecting…`)
  has no testID and is asserted only indirectly (timeout flow waits for the error
  overlay's button); the permissions-panel copy is asserted directly because that
  panel exposes its Text nodes individually.

## Test-id / side-channel reference

| Test-id                                                                         | Where                     | Purpose                                             |
| ------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------- |
| `e2eWcDappsBase`                                                                | TestCtrls                 | Reset + onboard + force flag + arm approveSession   |
| `e2eWcSynthProposalValid`                                                       | TestCtrls                 | Synthesise a VALID session_proposal                 |
| `e2eWcSynthProposalUnverified`                                                  | TestCtrls                 | Synthesise an UNKNOWN-verify session_proposal       |
| `e2eWcSynthProposalScam`                                                        | TestCtrls                 | Synthesise a scam-flagged session_proposal          |
| `e2eWcSynthDelete`                                                              | TestCtrls                 | Synthesise a session_delete for the fixture session |
| `e2eWcPairHang`                                                                 | TestCtrls                 | Arm the fake pair() to hang (timeout flow)          |
| `e2e-wc-reject-called`                                                          | TestCtrls (marker)        | Surfaces that the fake rejectSession() ran          |
| `e2e-scan-input` / `e2e-scan-submit`                                            | E2eScanInjector (scanner) | Type + inject a `wc:` URI into the real onScan      |
| `navbar-qr-button`                                                              | Header                    | Open the scanner                                    |
| `wc-proposal-domain`                                                            | Proposal sheet            | Domain pill; opens the permissions/details panel    |
| `wc-proposal-connect`                                                           | Proposal sheet footer     | Connect (approve)                                   |
| `wc-permissions-banner`                                                         | Permissions panel         | Verification banner (green VALID / red otherwise)   |
| `wc-scan-try-again`                                                             | Scanner error overlay     | Reset the scanner after an error                    |
| `settings-connected-apps-entry` / `connected-apps-count` / `connected-dapp-row` | Settings                  | Assert a session is present in the slice            |

## Running

```bash
# Build the E2E app (Metro picks up the .e2e.ts overrides)
yarn workspace @safe-global/mobile e2e:metro-ios   # or e2e:metro-android

# Run just this suite
maestro test --include-tags walletconnect-dapps apps/mobile/e2e
# or the orchestrated suite
maestro test apps/mobile/e2e/tests/walletconnect-dapps/__suite__.yml
```

## Flows

| Flow                           | Covers                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `pair-scan-happy.yml`          | Inject wc: URI → VALID proposal → Connect → toast → session |
| `pair-scan-invalid.yml`        | Non-wc QR → error overlay → Try again resets                |
| `pair-scan-timeout.yml`        | Valid wc URI, pair() hangs → timeout overlay after 10s      |
| `pair-deep-link.yml`           | wc: deep link → proposal sheet without the scanner mounting |
| `pair-proposal-reject.yml`     | Swipe-to-dismiss → rejectSession side-channel               |
| `pair-proposal-unverified.yml` | UNKNOWN verify → red banner + "Only continue if you trust…" |
| `pair-proposal-scam.yml`       | isScam → "flagged as a known scam" banner + trust warning   |
