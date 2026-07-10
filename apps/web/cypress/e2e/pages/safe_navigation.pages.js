// SafeSelectorDropdown (main bar)
const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const connectWalletBtn = '[data-testid="safe-selector-connect-wallet-btn"]'
const safeIcon = '[data-testid="safe-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerDetails = '[data-testid="safe-selector-trigger-details"]'
const copyAddressBtn = '[data-testid="copy-address-btn"]'
const currencySection = '[data-testid="safe-selector-balance"]'
const safeSelectorThreshold = '[data-testid="safe-selector-threshold"]'
const nestedSafesButton = '[data-testid="nested-safes-button"]'

// SafeSelectorDropdown dropdown list
const dropdownContent = '[data-slot="select-content"]'
const dropdownRow = '[data-slot="select-item"]'
const multichainItemSummary = '[data-testid="multichain-item-summary"]'
const notActivatedBadge = '[data-testid="not-activated-badge"]'
const pendingActivationChip = '[data-testid="pending-activation-chip"]'
const subAccountsContainer = '[data-testid="subacounts-container"]'

const balanceRegex = /\d/
export const multichainSafePolygonLabel = 'Multichain polygon'
export const multichainSafeSepoliaLabel = 'Multichain Sepolia'

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
    .closest('[data-slot="collapsible"]')
    .find('[data-testid="chain-logo"]')
    .should('have.length', expectedCount)
}

export function verifySafeIconVisible() {
  cy.get(safeIcon).should('be.visible')
}

export function verifySafeSelectorTriggerName(name) {
  cy.get(safeSelectorTriggerName).should('contain.text', name)
}

/** Short address may render on the name row alone or on a second row when a display name exists. */
export function verifySafeSelectorTriggerAddress(address) {
  cy.get(safeSelectorTriggerDetails).should('contain.text', address)
}

export function clickCopyAddressBtn() {
  cy.get(copyAddressBtn).should('be.visible').click()
}

export function verifyCurrencySection(text) {
  cy.get(currencySection).should('contain.text', text)
}

export function verifySafeSelectorThreshold(threshold, owners) {
  cy.get(safeSelectorThreshold).should('contain.text', `${threshold}/${owners}`)
}

export function clickOnNestedSafesBtn() {
  cy.get(nestedSafesButton).should('be.visible').click()
}

export function expandMultichainItem(index = 0) {
  cy.get(multichainItemSummary).eq(index).click()
  cy.get(subAccountsContainer).should('be.visible')
}

export function verifyNotActivatedSafeExists() {
  cy.get(subAccountsContainer).find(pendingActivationChip).should('exist')
}

export function verifyAddedSafesInDropdown(safes) {
  safes.forEach((address) => verifyDropdownContainsSafe(address))
}

export function verifyFirstDropdownRowHasBalance() {
  cy.get(dropdownContent).find(dropdownRow).first().invoke('text').should('match', balanceRegex)
}

export function verifyConnectWalletBtnVisible() {
  cy.get(connectWalletBtn).should('be.visible')
}

export function expandMultichainRowByAddress(address) {
  cy.get(dropdownContent).contains(address).closest('[data-slot="collapsible"]').find('button').first().click()
}

export function clickNotActivatedSubAccount() {
  cy.get(dropdownContent).find(dropdownRow).filter(`:has(${notActivatedBadge})`).first().click()
}
