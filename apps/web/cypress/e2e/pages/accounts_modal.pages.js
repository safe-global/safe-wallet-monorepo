import * as constants from '../../support/constants.js'

// Unified navigation: the old "All Accounts" modal is gone. Its list now lives inline in the
// safe-selector dropdown (Workspace / My accounts tabs), trust management moved to the
// "Manage list" modal (TrustedSafesModal), and renaming uses the shared EntryDialog.

// Safe-selector dropdown
const safeSelectorBlock = '[data-testid="space-safes-navigation-block"]'
const openSafesIcon = '[data-testid="open-safes-icon"]'
const dropdownContent = '[data-slot="select-content"]'
const dropdownScrollArea = '[data-testid="dropdown-scroll-area"]'
const dropdownRow = '[data-slot="select-item"]'
// A safe's name + rename pencil (SafeInfoDisplay) live in a select-item (single-chain safe) or in the
// collapsible trigger of a multi-chain group summary, so target either when renaming.
const safeRow = '[data-slot="select-item"], [data-slot="collapsible-trigger"]'
const safeItemAddress = '[data-testid="safe-item-address"]'
const searchInput = '[data-testid="safe-dropdown-search-input"]'
const tabLocal = '[data-testid="dropdown-tab-local"]'
const emptyList = '[data-testid="dropdown-empty"]'
const renameIcon = '[data-testid="safe-item-rename-btn"]'
const thresholdBadge = '[data-testid="account-threshold"]'
const awaitingConfirmationDot = '[data-testid="account-awaiting-confirmation"]'
const rowBalance = '[data-testid="row-end-column"]'

// Rename dialog (EntryDialog)
const nameInput = '[data-testid="name-input"]'
const saveBtn = '[data-testid="save-btn"]'

// Manage list modal (TrustedSafesModal)
const manageTrustedBtn = '[data-testid="dropdown-manage-trusted-btn"]'
const manageListEmptyBtn = '[data-testid="dropdown-manage-list-btn"]'
const manageSelectAll = '[data-testid="manage-trusted-select-all"]'
const manageSave = '[data-testid="manage-trusted-save"]'
const manageRow = '[data-testid="account-table-row"]'
const manageRowCheckbox = '[data-testid="account-select-checkbox"]'

// My accounts page — the "Add accounts" chooser replaced the old add-safe button
const importBtn = '[data-testid="import-btn"]'
const addAccountsBtn = '[data-testid="open-add-accounts-chooser-button"]'
const chooserSelectExisting = '[data-testid="add-accounts-select-existing"]'

export function openAccountsModal() {
  cy.get(safeSelectorBlock).should('be.visible')
  cy.get(openSafesIcon).click()
  cy.get(dropdownContent).should('be.visible')
  cy.get(dropdownScrollArea).should('be.visible')
}

/** Switch the open dropdown to the "My accounts" (trusted/local) tab. */
export function openMyAccountsTab() {
  cy.get(tabLocal).click()
}

export function verifyAccountsListVisible() {
  cy.get(dropdownScrollArea).should('be.visible')
}

export function verifyPinnedAccountsSectionVisible() {
  cy.get(dropdownScrollArea).should('be.visible')
  cy.get(dropdownScrollArea).find(safeItemAddress).should('exist')
}

export function verifyPinnedSafeExists(address) {
  cy.get(dropdownScrollArea).should('contain.text', address)
}

export function verifyEmptyPinnedList() {
  cy.get(emptyList).should('be.visible')
}

/** Open the Manage list modal from the dropdown, whether the trusted list is empty or not. */
export function openManageList() {
  cy.get('body').then(($body) => {
    if ($body.find(manageTrustedBtn).length > 0) {
      cy.get(manageTrustedBtn).click()
    } else {
      cy.get(manageListEmptyBtn).click()
    }
  })
  cy.get(manageSelectAll).should('be.visible')
}

function toggleTrustedSafeByName(name) {
  cy.contains(manageRow, name).find(manageRowCheckbox).click()
  cy.get(manageSave).click()
}

export function unpinSafeByName(name) {
  openManageList()
  toggleTrustedSafeByName(name)
}

export function verifyThresholdBadgeOnSafeCard(name) {
  cy.get(dropdownScrollArea).contains(dropdownRow, name).find(thresholdBadge).should('be.visible')
}

export function verifyMissingSignatureInfoExists() {
  cy.get(dropdownScrollArea).find(awaitingConfirmationDot).should('exist')
}

export function clickSafeOptionsBtn(index = 0) {
  cy.get(dropdownScrollArea).find(safeRow).eq(index).find(renameIcon).click({ force: true })
  cy.get(nameInput).should('be.visible')
}

export function verifyAccountsListContains(name) {
  cy.get(dropdownScrollArea).should('contain.text', name)
}

export function typeSafeName(name) {
  cy.get(nameInput).find('input').clear().type(name)
}

export function clickSaveBtn() {
  cy.get(saveBtn).click()
}

export function renameSafe(oldName, newName) {
  cy.get(dropdownScrollArea).contains(safeRow, oldName).find(renameIcon).click({ force: true })
  typeSafeName(newName)
  clickSaveBtn()
}

export function clickOnImportBtn() {
  cy.get(importBtn).scrollIntoView().should('be.visible').click()
}

export function verifyImportBtnVisible() {
  cy.get(importBtn).scrollIntoView().should('be.visible')
}

export function verifyFiatBalanceExists() {
  cy.get(dropdownScrollArea).find(rowBalance).first().invoke('text').should('match', /\d/)
}

export function verifyAddAccountsButtonVisible() {
  cy.get(addAccountsBtn).should('be.visible')
}

export function clickAddAccountsSelectExistingAndVerifyLoadFlow() {
  cy.get(addAccountsBtn).should('be.visible').click()
  cy.get(chooserSelectExisting).should('be.visible').click()
  cy.url().should('include', constants.loadNewSafeUrl)
}

export function searchSafe(query) {
  cy.get(searchInput).clear().type(query)
}

export function clearSearchInput() {
  cy.get(searchInput).clear()
}

export function verifySearchInputAbovePinnedSection() {
  cy.get(searchInput).then(($search) => {
    cy.get(dropdownScrollArea).then(($list) => {
      const position = $search[0].compareDocumentPosition($list[0])
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).to.equal(Node.DOCUMENT_POSITION_FOLLOWING)
    })
  })
}

export function verifyAccountsListDoesNotContain(text) {
  cy.get(dropdownScrollArea).should('not.contain.text', text)
}

export function verifyAccountsListItemCount(count) {
  cy.get(dropdownScrollArea).find(safeItemAddress).should('have.length', count)
}

export function verifyPinnedSafeDoesNotExist(address) {
  cy.get('body').then(($body) => {
    if ($body.find(`${dropdownScrollArea} ${safeItemAddress}`).length === 0) return
    cy.get(dropdownScrollArea).should('not.contain.text', address)
  })
}
