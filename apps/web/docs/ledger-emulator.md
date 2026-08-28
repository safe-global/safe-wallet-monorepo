# Running Cypress against an emulated Ledger

The Ledger tests do not mock the device. They run **Speculos**, Ledger's own emulator, against a
real build of Ledger's Ethereum app. The emulator shows the same confirmation screens a physical
device does and refuses to sign until its buttons are pressed, so the tests exercise the whole
signing path rather than a stand-in for it.

Two things have to be in place.

## 1. The app has to talk to the emulator

A browser reaches a physical Ledger over WebHID, which needs a device plugged in and a user gesture
to grant access. A headless browser can provide neither. Building the app with
`NEXT_PUBLIC_LEDGER_SPECULOS_URL` set swaps the Device Management Kit's WebHID transport for the
Speculos one:

```bash
NEXT_PUBLIC_IS_TEST_E2E=true \
NEXT_PUBLIC_LEDGER_SPECULOS_URL=http://localhost:9999 \
yarn workspace @safe-global/web build
```

The variable is read in `src/config/constants.ts` and only takes effect when `IS_TEST_E2E` is also
true, so a normal build always resolves to WebHID.

## 2. The emulator has to be running

Speculos needs an Ethereum app binary, which is not checked into this repository. Build one with
Ledger's own builder image:

```bash
mkdir -p apps/web/.speculos
git clone --depth 1 https://github.com/LedgerHQ/app-ethereum /tmp/app-ethereum
docker run --rm -v /tmp/app-ethereum:/app \
  ghcr.io/ledgerhq/ledger-app-builder/ledger-app-builder-lite:latest \
  bash -c 'cd /app && make BOLOS_SDK=$NANOSP_SDK'
cp /tmp/app-ethereum/build/nanos2/bin/app.elf apps/web/.speculos/app.elf
```

The build targets an SDK API level, and Speculos refuses to start against an app built for a newer
one ("invalid SDK api_level"). A master build currently needs api_level 26, which is why the compose
file pins Speculos 0.26.9. If you bump one, check the other.

Then start the emulator:

```bash
cd apps/web
LEDGER_EMULATOR_SEED="<test mnemonic>" docker compose -f docker-compose.speculos.yml up -d
```

The seed decides which addresses the emulator derives. Any Safe used in a signing test needs the
address derived from that seed as an owner, so the seed has to stay stable once tests depend on it.

## 3. Enable blind signing

Safe signs a SafeTx as EIP-712 typed data. With blind signing off — how the app boots — the device
does not prompt, it refuses: the screen reads "Blind signing must be enabled in settings" and the
APDU comes back `0x6a80`. Every signing test fails until it is on.

There is no APDU for the setting, so it has to be driven through the buttons:

```bash
apps/web/scripts/enable-ledger-blind-signing.sh
```

The setting lives in NVRAM and is lost on restart unless Speculos runs with `--save-nvram`, so run
this again after every restart of the container.

Once it is on, the device still asks the user to accept the risk before each signature: it shows
"Blind signing ahead — To accept risk, press both buttons", then paginates the domain hash and the
message hash, then offers "Sign message". `approveOnDevice()` walks that sequence.

## 4. Run the tests

```bash
cd apps/web
CYPRESS_LEDGER_SPECULOS_URL=http://localhost:5000 \
  yarn cypress run --spec 'cypress/e2e/hardware-wallet/*.cy.js'
```

Note the two different ports: the app sends APDUs to `9999`, and Cypress reads the screen and
presses the buttons over the REST API on `5000`.

## Writing a test that signs

Scanning for accounts needs no device interaction — the module reads addresses with `checkOnDevice`
false. Signing does. The click that starts signing does not resolve until the device approves, so
the test has to drive both sides:

```js
cy.get(signButton).click()
hardwareWallet.approveOnDevice(hardwareWallet.DEVICE_APPROVAL_SCREENS.signTransaction)
```

`clearDeviceScreens()` before each signing step. Speculos keeps every screen it has ever rendered,
so a test that reads screens without clearing first can match text left over from an earlier step
and approve the wrong thing.
