const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'

export function openSelector() {
  cy.get(safeSelectorBlock).should('be.visible')
  cy.get(openSafesIcon).click()
}

export function verifyItemExistsInSelector(name) {
  cy.contains(name).should('be.visible')
}

export function clickOnSafe(name) {
  cy.contains(name).click()
}
