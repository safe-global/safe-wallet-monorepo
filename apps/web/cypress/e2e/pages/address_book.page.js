import * as main from './main.page.js'

// Re-export common selectors from main.page.js for backward compatibility
export const tableRow = main.tableRow

export const addressBookRecipient = '[data-testid="address-book-recipient"]'
const saveBtn = '[data-testid="save-btn"]'
export const entryDialog = '[data-testid="entry-dialog"]'

const moreActionsBtn = '[data-testid="transfer-actions-btn"]'
const addToAddressBookBtn = '[data-testid="add-to-address-book-btn"]'

export function clickOnMoreActionsBtn() {
  cy.get(moreActionsBtn).click()
}

export function clickOnAddToAddressBookBtn() {
  cy.get(addToAddressBookBtn).click()
}

export function typeInName(name) {
  cy.get(main.nameInput).type(name)
}

function typeInAddress(address) {
  cy.get(main.addressInput).type(address)
}

export function clickOnSaveEntryBtn() {
  cy.get(saveBtn).click()
}

export function typeInNameInput(name) {
  cy.get(main.nameInput).clear().type(name).should('have.value', name)
}
