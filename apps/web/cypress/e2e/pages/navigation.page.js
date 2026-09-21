export const sideNavSettingsIcon = '[data-testid="settings-nav-icon"]'
export const setupSection = '[data-testid="setup-section"]'
export const modalBackBtn = '[data-testid="modal-back-btn"]'
export const newTxBtn = '[data-testid="new-tx-btn"]'
// The dialog close control kept its aria-label in the shadcn migration, but the icon
// lost the MUI-generated CloseIcon testid — target the labelled button instead.
const modalCloseBtn = '[role="dialog"] button[aria-label="close"]'
const discardTxBtnStr = 'Discard'
export const expandMoreIcon = 'svg[data-testid="ExpandMoreIcon"]'
const expandWalletBtn = '[data-testid="open-account-center"]'
const popoverContent = '[data-slot="popover-content"]'

const disconnectBtnStr = 'Disconnect'
const notConnectedStatus = 'Connect'

export function verifyTxBtnStatus(status) {
  cy.get(newTxBtn).should(status)
}
export function clickOnSideNavigation(option) {
  cy.get(option).should('exist').click()
}

export function clickOnModalCloseBtn(index) {
  cy.get(modalCloseBtn).eq(index).click()
}

export function clickOnDiscardTxBtn() {
  // Closing an in-progress tx flow asks to discard it. This used to be a native
  // confirm() that Cypress auto-accepted; the themed dialog needs a real click.
  cy.contains('button', discardTxBtnStr).click()
}

export function clickOnNewTxBtn() {
  cy.get(newTxBtn).click()
}

export function clickOnNewTxBtnS() {
  cy.get('button').contains('Next').click()
}

export function clickOnWalletExpandMoreIcon() {
  cy.get('[data-testid="open-account-center"]').click()
}

export function clickOnExpandWalletBtn() {
  cy.get(expandWalletBtn).should('be.visible').click()
  cy.get(popoverContent).should('be.visible')
}

export function clickOnDisconnectBtn() {
  cy.get('button').contains(disconnectBtnStr).click()
  cy.get('button').contains(notConnectedStatus)
}
