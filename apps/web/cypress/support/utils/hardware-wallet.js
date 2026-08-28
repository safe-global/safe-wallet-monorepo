/**
 * Cypress driver for a Ledger emulated by Speculos.
 *
 * Two halves have to line up for these helpers to work:
 *
 * 1. The app under test must be built with NEXT_PUBLIC_LEDGER_SPECULOS_URL set. That swaps the
 *    Device Management Kit's WebHID transport for the Speculos one (see
 *    src/services/onboard/ledger-module.ts). Without it the app looks for a physical device over
 *    WebHID, which a headless browser can never provide.
 * 2. A Speculos container must be running the Ethereum app and exposing its REST API. See
 *    docs/ledger-emulator.md for how to start one.
 *
 * The emulator behaves like the real device: it shows the same confirmation screens, and nothing
 * is signed until the buttons are pressed. So a test that signs has to drive the device as well as
 * the app — click the button in the UI, then approve on the device.
 *
 * Speculos REST API reference: https://speculos.ledger.com/user/api.html
 */

const onboardv2 = 'onboard-v2'
const accountSelect = 'account-select'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'
const accountCenter = '[data-testid="open-account-center"]'

const ledgerStr = 'Ledger'
const scanAccountsStr = 'Scan Accounts'
const connectStr = 'Connect'

/**
 * Screen text the Ethereum app shows when it is ready to be approved. Observed on the nanosp
 * Ethereum app 1.23.0 running under Speculos; a firmware bump can reword these.
 */
export const DEVICE_APPROVAL_SCREENS = {
  signTypedData: 'Sign message',
  signTransaction: 'Accept',
}

/**
 * Shown before a signature the device cannot clear-sign, once blind signing is enabled in the
 * app's settings. With the setting off the device does not prompt at all — it answers the APDU
 * with 0x6a80 and shows "Blind signing must be enabled in settings" instead.
 */
const BLIND_SIGNING_WARNING = 'To accept risk'

function speculosUrl() {
  return Cypress.env('LEDGER_SPECULOS_URL') || 'http://localhost:5000'
}

/**
 * Press one of the device's physical buttons.
 *
 * @param {'left'|'right'|'both'} button
 */
export function pressDeviceButton(button) {
  return cy.request('POST', `${speculosUrl()}/button/${button}`, { action: 'press-and-release' })
}

/**
 * Drop the emulator's event backlog.
 *
 * Speculos accumulates every screen it has ever rendered, so a test that reads screens without
 * clearing first will match text left over from an earlier step and approve the wrong thing.
 */
export function clearDeviceScreens() {
  return cy.request('DELETE', `${speculosUrl()}/events`)
}

/** All text the device has rendered since the last clearDeviceScreens(), oldest first. */
export function readDeviceScreens() {
  return cy.request('GET', `${speculosUrl()}/events`).then((response) => {
    return response.body.events.map((event) => event.text).join(' ')
  })
}

/**
 * Page through the device's screens with the right button until `text` appears.
 *
 * The Ethereum app paginates long transaction details across many screens, and the number of them
 * depends on the payload, so a test cannot know in advance how many presses it needs.
 */
export function pressRightUntilScreen(text, attemptsLeft = 40) {
  return readDeviceScreens().then((screens) => {
    if (screens.includes(text)) {
      return
    }

    if (attemptsLeft === 0) {
      throw new Error(`Ledger emulator never showed "${text}". Screens seen: ${screens}`)
    }

    return pressDeviceButton('right').then(() => pressRightUntilScreen(text, attemptsLeft - 1))
  })
}

/**
 * Approve whatever the device is currently asking about.
 *
 * Call this after the click that triggers signing, not before: the app has to have sent the APDU
 * for the device to have anything to show.
 *
 * @param {string} approvalScreen One of DEVICE_APPROVAL_SCREENS.
 */
export function approveOnDevice(approvalScreen) {
  return readDeviceScreens()
    .then((screens) => {
      // The risk warning takes both buttons, not the right one. Paging past it with the right
      // button walks into "Reject transaction" and the signature comes back 0x6980.
      if (screens.includes(BLIND_SIGNING_WARNING)) {
        return pressDeviceButton('both')
      }
    })
    .then(() => pressRightUntilScreen(approvalScreen))
    .then(() => pressDeviceButton('both'))
}

/**
 * Connect the first emulated Ledger account through the onboard modal.
 *
 * Scanning does not touch the device buttons — the module reads addresses with checkOnDevice
 * false — so this helper never needs to approve anything.
 */
export function connectLedgerSigner() {
  clearDeviceScreens()

  cy.get(connectWalletBtn).eq(0).should('be.enabled').click({ force: true })

  cy.get(onboardv2).shadow().find('button').contains(ledgerStr).click()

  // Scanning derives addresses over the transport, so it is slower than a UI interaction.
  cy.get(accountSelect, { timeout: 30000 }).shadow().find('button').contains(scanAccountsStr).click()

  cy.get(accountSelect, { timeout: 30000 }).shadow().find('input[type="checkbox"]').first().check({ force: true })

  cy.get(accountSelect).shadow().find('button').contains(connectStr).click()

  cy.get(accountCenter, { timeout: 30000 }).should('be.visible')
}

/** Assert a signer is connected — the header's account-center chip is on screen. */
export function verifySignerConnected() {
  cy.get(accountCenter).should('be.visible')
}
