// AccountsModal (All Accounts popup)
const allAccountsBtn = '[data-testid="all-accounts-btn"]'
const importBtn = '[data-testid="import-btn"]'
const accountsList = '[data-testid="accounts-list"]'
const nameInput = '[data-testid="name-input"]'
const saveBtn = '[data-testid="save-btn"]'
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
const dropdownContent = '[data-slot="select-content"]'

export function openAccountsModal() {
  cy.get('[data-testid="space-safes-navigation-block"]').should('be.visible')
  cy.get('[data-testid="open-safes-icon"]').click()
  cy.get(dropdownContent).should('be.visible')
  cy.get(allAccountsBtn).scrollIntoView().should('be.visible').click()
  cy.get(accountsList).should('be.visible')
}

export function verifyAccountsListVisible() {
  cy.get(accountsList).should('be.visible')
}

export function verifyPinnedAccountsSectionVisible() {
  cy.get(pinnedAccounts).should('be.visible')
}

export function verifyPinnedSafeExists(address) {
  cy.get(pinnedAccounts).parent().should('contain.text', address)
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

export function clickSafeOptionsBtn(index = 0) {
  cy.get(safeOptionsBtn).eq(index).should('be.visible').click()
  cy.get(renameBtn).should('be.visible')
}

export function clickRenameBtn() {
  cy.get(renameBtn).should('be.visible').click()
}

export function verifyAccountsListContains(name) {
  cy.get(accountsList).should('contain.text', name)
}

export function typeSafeName(name) {
  cy.get(nameInput).find('input').clear().type(name)
}

export function clickSaveBtn() {
  cy.get(saveBtn).click()
}

export function renameSafe(oldName, newName) {
  cy.get(accountsList).contains(oldName).closest(safeItemCard).find(safeOptionsBtn).click()
  clickRenameBtn()
  typeSafeName(newName)
  clickSaveBtn()
}

export function clickOnImportBtn() {
  cy.get(importBtn).scrollIntoView().should('be.visible').click()
}

export function verifyAddSafeButtonVisible() {
  cy.get(addSafeButton).should('be.visible')
}

export function verifyPinnedSectionDoesNotExist() {
  cy.get(pinnedAccounts).should('not.exist')
}

export function verifyPinnedSafeDoesNotExist(address) {
  cy.get(pinnedAccounts).nextUntil(':not([data-testid="safe-item-card"])').should('not.contain.text', address)
}
