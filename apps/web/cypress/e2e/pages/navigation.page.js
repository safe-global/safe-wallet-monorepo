export const sideNavSettingsIcon = '[data-testid="settings-nav-icon"]'
export const setupSection = '[data-testid="setup-section"]'
export const modalBackBtn = '[data-testid="modal-back-btn"]'
export const newTxBtn = '[data-testid="new-tx-btn"]'
const modalCloseIcon = '[data-testid="CloseIcon"]'
export const expandMoreIcon = 'svg[data-testid="ExpandMoreIcon"]'
const sentinelStart = 'div[data-testid="sentinelStart"]'

const disconnectBtnStr = 'Disconnect'
const notConnectedStatus = 'Connect'

export function verifyTxBtnStatus(status) {
  cy.get(newTxBtn).should(status)
}
export function clickOnSideNavigation(option) {
  cy.get(option).should('exist').click()
}

export function clickOnModalCloseBtn(index) {
  cy.get(modalCloseIcon).eq(index).trigger('click')
}

export function clickOnNewTxBtn() {
  cy.get(newTxBtn).click()
}

export function clickOnNewTxBtnS() {
  cy.get('button').contains('Next').click()
}

export function clickOnWalletExpandMoreIcon() {
  cy.get(expandMoreIcon).eq(0).click({ force: true })
  cy.get(sentinelStart).next().should('exist')
}

export function clickOnDisconnectBtn() {
  cy.get('button').contains(disconnectBtnStr).click()
  cy.get('button').contains(notConnectedStatus)
}
