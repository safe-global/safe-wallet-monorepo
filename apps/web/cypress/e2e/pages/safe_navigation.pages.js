// SafeSelectorDropdown (main bar)
const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const safeIcon = '[data-testid="safe-icon"]'
const safeSelectorTriggerName = '[data-testid="safe-selector-trigger-name"]'
const safeSelectorTriggerAddress = '[data-testid="safe-selector-trigger-address"]'
const copyAddressBtn = '[data-testid="copy-address-btn"]'
const currencySection = '[data-testid="safe-selector-balance"]'
const chainNavigationButton = '[data-testid="space-chain-navigation-button"]'

// SafeSelectorDropdown dropdown list
const dropdownContent = '[data-slot="select-content"]'
const multichainItemSummary = '[data-testid="multichain-item-summary"]'

// ChainSelectorBlock / Add Network
const addNetworkBtn = '[data-testid="add-network-btn"]'
const deployedChainBtn = '[data-testid="deployed-chain-btn"]'
const addChainDialog = '[data-testid="add-chain-dialog"]'
const addedNetwork = '[data-testid="added-network"]'
const modalAddNetworkBtn = '[data-testid="modal-add-network-btn"]'
const allNetworksAccordion = '[data-testid="all-networks-accordion"]'

// Sidebar navigation
const sidebarContainer = '[data-testid="sidebar-container"]'
const sidebarListItem = '[data-testid="sidebar-list-item"]'
const sidebarSettingsItem = '[data-testid="sidebar-settings-item"]'
const queuedTxInfo = '[data-testid="queued-tx-info"]'
const listItemNeedHelp = '[data-testid="list-item-need-help"]'

export const undeployedSafeLabel = 'Not activated'
export const multichainSafePolygonLabel = 'Multichain polygon'
export const multichainSafeSepoliaLabel = 'Multichain Sepolia'
export const createSafeMsg = (network) => `Successfully added your account on ${network}`

// AccountsModal (All Accounts popup)
const allAccountsBtn = '[data-testid="all-accounts-btn"]'
const importBtn = '[data-testid="import-btn"]'
const accountsList = '[data-testid="accounts-list"]'
const pinnedAccounts = '[data-testid="pinned-accounts"]'
const emptyPinnedList = '[data-testid="empty-pinned-list"]'
const addSafeButton = '[data-testid="add-safe-button"]'
const bookmarkIcon = '[data-testid="bookmark-icon"]'
const missingSignatureInfo = '[data-testid="missing-signature-info"]'
const readOnlyChip = '[data-testid="read-only-chip"]'
const pendingActivationIcon = '[data-testid="pending-activation-icon"]'
const pendingActivationChip = '[data-testid="pending-activation-chip"]'
const safeItemCard = '[data-testid="safe-item-card"]'
const safeOptionsBtn = '[data-testid="safe-options-btn"]'
const renameBtn = '[data-testid="rename-btn"]'

export function openSelector() {
  cy.get(safeSelectorBlock).should('be.visible')
  cy.get(openSafesIcon).click()
}

export function openAccountsModal() {
  cy.get(safeSelectorBlock).should('be.visible')
  cy.get(openSafesIcon).click()
  cy.get(dropdownContent).should('be.visible')
  cy.get(allAccountsBtn).scrollIntoView().should('be.visible').click()
  cy.get(accountsList).should('be.visible')
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
    .find('[data-testid="chain-logo"]')
    .should('have.length', expectedCount)
}

export function verifySafeIconVisible() {
  cy.get(safeIcon).should('be.visible')
}

export function verifySafeSelectorTriggerName(name) {
  cy.get(safeSelectorTriggerName).should('contain.text', name)
}

export function verifySafeSelectorTriggerAddress(address) {
  cy.get(safeSelectorTriggerAddress).should('contain.text', address)
}

export function clickCopyAddressBtn() {
  cy.get(copyAddressBtn).should('be.visible').click()
}

export function verifyCurrencySection(text) {
  cy.get(currencySection).should('contain.text', text)
}

export function clickChainNavigationButton() {
  cy.get(chainNavigationButton).should('be.visible').click()
  cy.get(allNetworksAccordion).should('be.visible')
}

export function clickAllNetworksAccordion() {
  cy.get(allNetworksAccordion).should('be.visible').click()
  cy.get(addNetworkBtn).should('be.visible')
}

export function clickAddNetworkBtn(chainName) {
  cy.get(addNetworkBtn).filter(`[aria-label="Add ${chainName}"]`).click()
  cy.get(addChainDialog).should('be.visible')
}

export function clickModalAddNetworkBtn() {
  cy.get(modalAddNetworkBtn).should('be.visible').click()
}

export function verifyModalAddNetworkBtnDisabled() {
  cy.get(modalAddNetworkBtn).should('be.disabled')
}

export function verifyNetworkNotInAddList(networkName) {
  cy.get(addNetworkBtn).each(($btn) => {
    cy.wrap($btn).should('not.have.attr', 'aria-label', `Add ${networkName}`)
  })
}

export function verifyDeployedChainsInDropdown(chainNames) {
  chainNames.forEach((name) => {
    cy.get(deployedChainBtn).filter(`[aria-label="${name}"]`).should('exist')
  })
}

export function verifyAddedNetworkInDialog(chainName) {
  cy.get(addedNetwork).should('be.visible').and('contain.text', chainName)
}

export function verifyNetworkInputAbsentInDialog() {
  cy.get(addChainDialog).find('[id="network-input"]').should('not.exist')
}

export function verifyAddNetworkBtnListNotEmpty() {
  cy.get(addNetworkBtn).should('have.length.gte', 1)
}

export function verifyAddNetworkBtnExists(chainName) {
  cy.get(addNetworkBtn).filter(`[aria-label="Add ${chainName}"]`).should('exist')
}

export function addNetwork(chainName) {
  clickChainNavigationButton()
  clickAllNetworksAccordion()
  clickAddNetworkBtn(chainName)
  clickModalAddNetworkBtn()
  cy.get(addChainDialog).should('not.exist')
}

export function verifySidebarContainerVisible() {
  cy.get(sidebarContainer).should('be.visible')
}

export function verifySidebarSettingsItemVisible() {
  cy.get(sidebarSettingsItem).should('be.visible')
}

export function verifySidebarListItem() {
  cy.get(sidebarListItem).should('be.visible')
}

export function verifyQueuedTxInfo(count) {
  cy.get(queuedTxInfo).should('be.visible').and('contain.text', String(count))
}

export function verifyListItemNeedHelp() {
  cy.get(listItemNeedHelp).should('be.visible')
}

export function verifyAccountsListVisible() {
  cy.get(accountsList).should('be.visible')
}

export function verifyPinnedAccountsSectionVisible() {
  cy.get(pinnedAccounts).should('be.visible')
}

export function verifyEmptyPinnedList() {
  cy.get(emptyPinnedList).should('be.visible')
}

export function clickAddSafeButton() {
  cy.get(addSafeButton).should('be.visible').click()
}

export function clickBookmarkIconByIndex(index) {
  cy.get(bookmarkIcon).eq(index).should('be.visible').click()
}

export function unpinSafeByName(name) {
  cy.get(accountsList).contains(name).closest(safeItemCard).find(bookmarkIcon).click()
}

export function verifyMissingSignatureInfo(threshold, owners) {
  cy.get(missingSignatureInfo).should('be.visible').and('contain.text', `${threshold}/${owners}`)
}

export function verifyReadOnlyChipVisible() {
  cy.get(readOnlyChip).should('be.visible')
}

export function verifyPendingActivationIconVisible() {
  cy.get(pendingActivationIcon).should('be.visible')
}

export function expandMultichainItem(index = 0) {
  cy.get('[data-testid="multichain-item-summary"]').eq(index).click()
  cy.get('[data-testid="subacounts-container"]').should('be.visible')
}

export function verifyNotActivatedSafeExists() {
  cy.get('[data-testid="subacounts-container"]').find(pendingActivationChip).should('exist')
}

export function clickSafeOptionsBtn(index = 0) {
  cy.get(safeOptionsBtn).eq(index).should('be.visible').click()
  cy.get(renameBtn).should('be.visible')
}

export function clickRenameBtn() {
  cy.get(renameBtn).should('be.visible').click()
}

export function verifyMultichainItemSummaryVisible() {
  cy.get(multichainItemSummary).should('be.visible')
}

export function verifyAccountsListContains(name) {
  cy.get(accountsList).should('contain.text', name)
}

export function clickOnImportBtn() {
  cy.get(importBtn).scrollIntoView().should('be.visible').click()
}
