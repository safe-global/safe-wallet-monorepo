import * as main from '../../e2e/pages/main.page'
import * as constants from '../constants'
import { PRIVATE_KEY_MODULE_LABEL } from '../../../src/services/private-key-module/constants'

const onboardv2 = 'onboard-v2'
const pkInput = '[data-testid="private-key-input"]'
const pkConnectBtn = '[data-testid="pk-connect-btn"]'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'

const connectedWalletChip = '[data-testid="open-account-center"]'

const privateKeyStr = 'Private key'

const MODAL_OPEN_TIMEOUT_MS = 5000
const MODAL_OPEN_ATTEMPTS = 4

const hasPrivateKeyInput = ($body) => $body.find(pkInput).length > 0

const hasPrivateKeyOption = ($body) => {
  const buttons = $body.find(onboardv2)[0]?.shadowRoot?.querySelectorAll('button') ?? []
  return [...buttons].some((button) => button.textContent.includes(privateKeyStr))
}

// The modal opens either on the wallet list or straight on the private-key input.
const isWalletModalOpen = () => {
  const $body = Cypress.$('body')
  return hasPrivateKeyInput($body) || hasPrivateKeyOption($body)
}

// The app drops a "Connect wallet" click that comes right after a disconnect, so click again.
function openWalletModal(attemptsLeft = MODAL_OPEN_ATTEMPTS) {
  cy.get(connectWalletBtn).filter(':visible').first().should('be.enabled').click({ force: true })
  main.pollUntil(isWalletModalOpen, MODAL_OPEN_TIMEOUT_MS).then((opened) => {
    if (opened) return
    if (attemptsLeft <= 1) throw new Error(`The connect-wallet modal did not open after ${MODAL_OPEN_ATTEMPTS} clicks`)
    openWalletModal(attemptsLeft - 1)
  })
}

/** Connects the private-key signer through the connect-wallet modal and waits until the header shows it. */
export function connectSigner(signer) {
  cy.get(`${pkInput}, ${connectWalletBtn}`, { timeout: 30000 })
    .filter(':visible')
    .first()
    .then(($element) => {
      if ($element.is(pkInput)) return
      openWalletModal()
      cy.get('body').then(($body) => {
        if (!hasPrivateKeyInput($body)) cy.get(onboardv2).shadow().find('button').contains(privateKeyStr).click()
      })
    })
  cy.get(pkInput).then(($input) => {
    $input.val(signer)
    cy.wrap($input).trigger('input').trigger('change')
  })
  cy.get(pkConnectBtn).click()
  cy.get(connectedWalletChip, { timeout: 30000 }).should('be.visible')
  main.closeOutreachPopup()
}

/**
 * Connects the private-key signer by seeding storage, so the app auto-reconnects without opening
 * the connect-wallet modal. Skips the slow UI flow of connectSigner().
 *
 * The app reconnects the last wallet on startup (useOnboard -> connectLastWallet): it reads the
 * wallet label from localStorage and the key from sessionStorage, and connects silently because
 * isWalletUnlocked() returns true for the private-key module. Both slots must exist before app JS
 * runs on the load that connects.
 *
 * Two modes:
 * - With `url`: seeds in onBeforeLoad and visits (single load, fastest). Use to replace an adjacent
 *   `cy.visit(url)` + `connectSigner(signer)`.
 * - Without `url`: seeds the already-loaded window and reloads. Use when the visit happened earlier
 *   (e.g. in beforeEach) and only the connect is in the test body.
 *
 * @param {string} signer - Private key of the signer to connect.
 * @param {string} [url] - URL to visit; omit to seed the current window and reload.
 * @param {object} [options] - Extra cy.visit options; its onBeforeLoad runs after seeding.
 * @param {Record<string, unknown>} [options.extraStorage] - localStorage entries to seed in
 *   onBeforeLoad (values are JSON-stringified). Use to pre-seed persisted state (e.g. a batch)
 *   on the single load, replacing a later addToLocalStorage + cy.reload().
 * @param {boolean} [options.waitForConnection=true] - Wait for the connected-wallet header chip
 *   before resolving. The wallet reconnects asynchronously after load, so proceeding immediately
 *   can race the connection. Set false on pages that don't render that chip (e.g. welcome/accounts).
 */
export function connectSignerViaStorage(signer, url, { extraStorage, waitForConnection = true, ...visitOptions } = {}) {
  const seed = (win) => {
    win.localStorage.setItem(constants.localStorageKeys.SAFE_v2__lastWallet, JSON.stringify(PRIVATE_KEY_MODULE_LABEL))
    win.sessionStorage.setItem(
      constants.sessionStorageKeys.SAFE_v2__privateKeyModulePK,
      JSON.stringify({ isOpen: false, privateKey: signer }),
    )
    if (extraStorage) {
      Object.entries(extraStorage).forEach(([key, value]) => {
        win.localStorage.setItem(key, JSON.stringify(value))
      })
    }
  }

  if (url) {
    cy.visit(url, {
      ...visitOptions,
      onBeforeLoad(win) {
        seed(win)
        visitOptions.onBeforeLoad?.(win)
      },
    })
  } else {
    cy.window().then(seed)
    cy.reload()
  }

  // The last wallet reconnects asynchronously after the page loads (useOnboard ->
  // connectLastWallet), so wait for the header's connected-wallet chip to be visible before
  // proceeding; otherwise the test can act while the wallet is still (briefly) disconnected.
  // The reconnect can take well over the default 10s when the RPC is rate-limited (429s), so
  // wait longer before giving up.
  if (waitForConnection) {
    cy.get(connectedWalletChip, { timeout: 30000 }).should('be.visible')
  }
  // The launch screen covers the page, so clicks hit it until it unmounts
  cy.get('[data-testid="launch-screen"]', { timeout: 30000 }).should('not.exist')
}
