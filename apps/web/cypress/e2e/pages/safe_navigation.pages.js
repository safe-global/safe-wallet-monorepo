// SafeSelectorDropdown (main bar)
const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const connectWalletBtn = '[data-testid="dropdown-connect-wallet-body-btn"]'
const safeIcon = '[data-testid="safe-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerDetails = '[data-testid="safe-selector-trigger-details"]'
const copyAddressBtn = '[data-testid="copy-address-btn"]'
const safeSelectorThreshold = '[data-testid="account-threshold"]'
const nestedSafesButton = '[data-testid="nested-safes-button"]'

// SafeSelectorDropdown dropdown list
const dropdownContent = '[data-slot="select-content"]'
const dropdownRow = '[data-slot="select-item"]'

const balanceRegex = /\d/
export const multichainSafeSepoliaLabel = 'Multichain Sepolia'

/** Short address may render on the name row alone or on a second row when a display name exists. */
export function verifySafeSelectorTriggerAddress(address) {
  cy.get(safeSelectorTriggerDetails).should('contain.text', address)
}

export function clickCopyAddressBtn() {
  cy.get(copyAddressBtn).should('be.visible').click()
}

export function clickOnNestedSafesBtn() {
  cy.get(nestedSafesButton).should('be.visible').click()
}
