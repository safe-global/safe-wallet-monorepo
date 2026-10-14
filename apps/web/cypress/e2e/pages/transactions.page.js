import { fixtureGetters } from '../../support/fixture.js'
import * as main from './main.page'
import { continueSignBtn, clickOnContinueSignTransactionBtn, signAndOpenExecuteStep } from './create_tx.pages'
import * as constants from '../../support/constants.js'

const connectedWalletExecutionMethod = '[data-testid="connected-wallet-execution-method"]'
const relayExecutionMethod = '[data-testid="relay-execution-method"]'
const txStatus = '[data-testid="transaction-status"]'
const finishTransactionBtn = '[data-testid="finish-transaction-btn"]'
const executeBtn = '[data-testid="combo-submit-execute"]'
const signedNotice = '[data-testid="signed-notice"]'
const radioItem = '[data-slot="radio-group-item"]'
const signBtn = '[data-testid="sign-btn"]'
const txConfirmBtn = '[data-track="tx-list: Confirm transaction"] > button'
const untrustedFallbackHandlerWarning = '[data-testid="untrusted-fallback-handler-warning"]'

const txCompletedStr = 'Transaction was successful'
const EXECUTION_METHOD_SETTLE_MS = 10000
export const relayRemainingAttemptsStr = 'free transactions left today'
const relaysRemainingEndpoint = '**/v1/chains/*/relay/*'
const chainsListEndpoint = /\/v[12]\/chains(\?|$)/
const freeDailyRelayOption = 'FREE_DAILY_LIMIT'
const mockedDailyRelays = { remaining: 5, limit: 5 }

export const fallbackhandlerTx = fixtureGetters('fallbackHandlers', {
  illegalContract:
    '&id=multisig_0xc36A530ccD728d36a654ccedEB7994473474C018_0xceccff6539d75da107014e1a4ae9ccb864a6a4bf10b4e0dd38431ac80148f2f5',
})

export function visitTxHistoryInSinglePage(safe) {
  cy.intercept('GET', '**/v1/chains/*/safes/*/transactions/history**', (req) => {
    const url = new URL(req.url)
    if (!url.searchParams.has('cursor')) {
      url.searchParams.set('cursor', 'limit=100&offset=0')
      req.url = url.toString()
    }
  }).as('txHistory')
  cy.visit(constants.transactionsHistoryUrl + safe)
  cy.wait('@txHistory')
}

export function verifyUntrustedHandllerWarningVisible() {
  cy.get(untrustedFallbackHandlerWarning).should('be.visible')
}

export function verifyUntrustedHandllerWarningDoesNotExist() {
  cy.get(untrustedFallbackHandlerWarning).should('not.exist')
}

export function verifyTxConfirmBtnDisabled() {
  cy.get(txConfirmBtn).should('be.disabled')
}

export function verifySignBtnEnabled() {
  cy.get(signBtn).should('be.enabled')
}

export function selectConnectedWalletIfOffered() {
  main
    .pollUntil(() => Cypress.$(connectedWalletExecutionMethod).length > 0, EXECUTION_METHOD_SETTLE_MS)
    .then((isOffered) => {
      if (!isOffered) return
      cy.get(connectedWalletExecutionMethod).click()
      cy.get(connectedWalletExecutionMethod).find(radioItem).should('have.attr', 'aria-checked', 'true')
    })
}

function selectRelayAndWaitUntilChecked() {
  cy.get(relayExecutionMethod, { timeout: 30000 }).click()
  verifyRelayExecutionMethodChecked()
}

function continueToSubmitStep() {
  cy.get(continueSignBtn, { timeout: 30000 }).should('be.enabled')
  clickOnContinueSignTransactionBtn()
}

// The Safe creation review also uses the connected-wallet test ID for its Pay later option.
export function selectRelayOtion() {
  cy.get(relayExecutionMethod).click()
}

export function verifyRelayExecutionMethodChecked() {
  cy.get(relayExecutionMethod).find(radioItem).should('have.attr', 'aria-checked', 'true')
}

export function clickOnExecuteBtn() {
  cy.get(executeBtn, { timeout: 60000 }).should('be.enabled').click()
}

export function verifyExecuteBtnIsVisible() {
  cy.get(executeBtn).scrollIntoView().should('be.visible')
}

export function clickOnFinishBtn() {
  cy.get(finishTransactionBtn).click()
}

export function waitForTxToComplete() {
  cy.get(txStatus, { timeout: 240000 }).should('contain', txCompletedStr)
}

function executeAndFinish() {
  clickOnExecuteBtn()
  waitForTxToComplete()
  clickOnFinishBtn()
}

export function signAndExecuteWithConnectedWallet() {
  continueToSubmitStep()
  signAndOpenExecuteStep()
  selectConnectedWalletIfOffered()
  executeAndFinish()
}

export function signAndExecuteWithRelay() {
  continueToSubmitStep()
  signAndOpenExecuteStep()
  selectRelayAndWaitUntilChecked()
  executeAndFinish()
}

export function executeSignedTxWithConnectedWallet() {
  continueToSubmitStep()
  cy.get(signedNotice, { timeout: 30000 }).should('be.visible')
  selectConnectedWalletIfOffered()
  executeAndFinish()
}

export function mockFreeDailyRelay() {
  cy.intercept('GET', relaysRemainingEndpoint, { body: mockedDailyRelays })
  cy.intercept('GET', chainsListEndpoint, (req) => {
    req.continue((res) => {
      if (!Array.isArray(res.body?.results)) return
      const results = res.body.results.map((chain) =>
        chain.relayer
          ? {
              ...chain,
              relayer: {
                ...chain.relayer,
                gasPaymentOptions: [...new Set([...(chain.relayer.gasPaymentOptions ?? []), freeDailyRelayOption])],
              },
            }
          : chain,
      )
      res.send(res.statusCode, { ...res.body, results })
    })
  })
}
