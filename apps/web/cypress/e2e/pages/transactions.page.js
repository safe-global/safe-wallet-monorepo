const executeNowOption = '[data-testid="execute-checkbox"]'
const executeLaterOption = '[data-testid="sign-checkbox"]'
const connectedWalletExecutionMethod = '[data-testid="connected-wallet-execution-method"]'
const txStatus = '[data-testid="transaction-status"]'
const finishTransactionBtn = '[data-testid="finish-transaction-btn"]'
const executeFormBtn = '[data-testid="execute-form-btn"]'
const signBtn = '[data-testid="sign-btn"]'
const txConfirmBtn = '[data-track="tx-list: Confirm transaction"] > button'
const untrustedFallbackHandlerWarning = '[data-testid="untrusted-fallback-handler-warning"]'

const executeBtnStr = 'Execute'
const txCompletedStr = 'Transaction was successful'
export const relayRemainingAttemptsStr = 'free transactions left today'
const confirmTx = 'Confirm transaction'

export const fallbackhandlerTx = {
  illegalContract:
    '&id=multisig_0xc36A530ccD728d36a654ccedEB7994473474C018_0xceccff6539d75da107014e1a4ae9ccb864a6a4bf10b4e0dd38431ac80148f2f5',
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

export function selectExecuteNow() {
  cy.get(executeNowOption).click()
}

export function selectExecuteLater() {
  cy.get(executeLaterOption).click()
}

export function selectConnectedWalletOption() {
  cy.get(connectedWalletExecutionMethod).click()
}

export function selectRelayOtion() {
  cy.get(connectedWalletExecutionMethod).prev().click()
}

export function clickOnExecuteBtn() {
  cy.get(executeFormBtn).click()
}

export function verifyExecuteBtnIsVisible() {
  cy.get(executeFormBtn).scrollIntoView().should('be.visible')
}

export function clickOnFinishBtn() {
  cy.get(finishTransactionBtn).click()
}

export function waitForTxToComplete() {
  cy.get(txStatus, { timeout: 240000 }).should('contain', txCompletedStr)
}

export function executeFlow_1() {
  selectExecuteNow()
  selectConnectedWalletOption()
  clickOnExecuteBtn()
  // Wait for tx to be processed
  cy.wait(60000)
  clickOnFinishBtn()
}

export function executeFlow_2() {
  selectExecuteNow()
  selectRelayOtion()
  clickOnExecuteBtn()
  // Wait for tx to be processed
  cy.wait(60000)
  clickOnFinishBtn()
}

export function executeFlow_3() {
  selectConnectedWalletOption()
  clickOnExecuteBtn()
  // Wait for tx to be processed
  cy.wait(60000)
  clickOnFinishBtn()
}
