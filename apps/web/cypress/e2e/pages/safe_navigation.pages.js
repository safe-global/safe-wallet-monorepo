const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const dropdownContent = '[data-slot="select-content"]'
const chainLogo = '[data-testid="chain-logo"]'

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

export function verifyDropdownContainsSafe(address) {
  cy.get(dropdownContent).should('be.visible').and('contain', address)
}

export function verifyMultichainSafeChainLogos(address, expectedCount) {
  cy.get(dropdownContent)
    .contains(address)
    .parents('[role="option"]')
    .find(chainLogo)
    .should('have.length', expectedCount)
}
