import * as main from '../../e2e/pages/main.page'
import * as constants from '../constants'
import { PRIVATE_KEY_MODULE_LABEL } from '../../../src/services/private-key-module/constants'

const onboardv2 = 'onboard-v2'
const pkInput = '[data-testid="private-key-input"]'
const pkConnectBtn = '[data-testid="pk-connect-btn"]'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'

const privateKeyStr = 'Private key'

export function connectSigner(signer) {
  let retryCount = 0

  const actions = {
    privateKey: () => {
      cy.wait(2000)
      cy.get('body').then(($body) => {
        if ($body.find(onboardv2).length > 0) {
          cy.get(onboardv2)
            .shadow()
            .find('button')
            .contains(privateKeyStr)
            .click()
            .then(() => handlePkConnect())
        }
      })
    },
    retry: () => {
      retryCount++
      if (retryCount > 20) {
        throw new Error('Failed to connect after 20 retries')
      }
      cy.wait(1000).then(enterPrivateKey)
    },
  }

  function handlePkConnect() {
    cy.get('body').then(($body) => {
      if ($body.find(pkInput).length > 0) {
        cy.get(pkInput)
          .find('input')
          .then(($input) => {
            $input.val(signer)
            cy.wrap($input).trigger('input').trigger('change')
          })
        cy.get(pkConnectBtn).click()
        cy.wait(2000)
      }
    })
  }

  function enterPrivateKey() {
    cy.wait(3000)
    return cy.get('body').then(($body) => {
      if ($body.find(pkInput).length > 0) {
        cy.get(pkInput)
          .find('input')
          .then(($input) => {
            $input.val(signer)
            cy.wrap($input).trigger('input').trigger('change')
          })

        cy.get(pkConnectBtn).click()
      } else if ($body.find(connectWalletBtn).length > 0) {
        cy.get(connectWalletBtn)
          .eq(0)
          .should('be.enabled')
          .click({ force: true })
          .then(() => {
            const actionKey = $body.find(onboardv2).length > 0 ? 'privateKey' : 'retry'
            actions[actionKey]()
          })
      }
    })
  }

  enterPrivateKey().then(() => {
    main.closeOutreachPopup()
  })
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
  // connectLastWallet), so wait for the header's connected-wallet chip before proceeding;
  // otherwise the test can act while the wallet is still (briefly) disconnected.
  if (waitForConnection) {
    cy.get('[data-testid="open-account-center"]', { timeout: 30000 }).should('exist')
  }
}
