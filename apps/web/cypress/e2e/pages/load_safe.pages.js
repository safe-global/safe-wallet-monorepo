import * as main from '../pages/main.page'
import { addressBookRecipient } from '../pages/address_book.page'

const removeOwnerBtn = '[data-testid="remove-owner-btn"]'
const addOwnerBtn = '[data-testid="add-new-signer"]'
const ownerPolicyStepForm = '[data-testid="owner-policy-step-form"]'
const addressItem = '[data-testid="address-book-input"]'
const ownerName = '[data-testid="owner-name"]'
const ownerNameInput = `input${ownerName}, ${ownerName} input`
const ownerNameLabel = 'Signer name'

function getOwnerNameInput(index) {
  return cy.get(ownerNameInput).eq(index)
}

export function clickOnAddNewOwnerBtn() {
  cy.get(addOwnerBtn).click()
}

export function verifyOnwerName(index, name) {
  getOwnerNameInput(index).should('have.value', name)
  cy.get(addressBookRecipient).eq(index).should('contain', name)
}

export function verifyOwnerAddress(index, address) {
  cy.get(addressItem).eq(index).find('input').should('have.value', address)
}

export function clickOnRemoveOwnerBtn(index) {
  cy.get(removeOwnerBtn).eq(index).click()
}

export function verifyownerNameFormatIsValid() {
  cy.get(ownerName)
    .eq(0)
    .then(($el) => {
      const $label = $el.is('input') ? $el.closest('[data-slot="field"]').find('label') : $el.find('label')
      cy.wrap($label).contains(ownerNameLabel).should('be.visible')
    })
}

export function verifyOwnerNamesInConfirmationStep(names) {
  main.verifyValuesExist(ownerPolicyStepForm, names)
}

export function verifyDataDoesNotExist(data) {
  main.verifyValuesDoNotExist(ownerPolicyStepForm, data)
}

export function inputOwnerName(index, name) {
  getOwnerNameInput(index).clear().type(name, main.nameTypingOptions).should('have.value', name)
}

export function clearOwnerAddress(index) {
  cy.get(addressItem).eq(index).find('input').clear()
}

export function inputOwnerAddress(index, name) {
  cy.wait(500)
  cy.get(addressItem).eq(index).find('input').clear().type(name)
}

export function verifyOnwerNameENS(index, ens) {
  getOwnerNameInput(index).invoke('attr', 'placeholder').should('contain', ens)
}

export function clickOnNextBtn() {
  cy.contains(main.nextBtnStr).click()
}
