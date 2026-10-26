import * as constants from '../../support/constants'
import * as sidebar from '../pages/sidebar.pages'
import * as main from '../pages/main.page'
import { addressBookRecipient } from '../pages/address_book.page'

const safeDataForm = '[data-testid=load-safe-form]'
const removeOwnerBtn = '[data-testid="remove-owner-btn"]'
const addOwnerBtn = '[data-testid="add-new-signer"]'
const ownerPolicyStepForm = '[data-testid="owner-policy-step-form"]'
const addressItem = '[data-testid="address-book-input"]'
const ownerName = '[data-testid="owner-name"]'
const ownerNameInput = `input${ownerName}, ${ownerName} input`
const networkSelectorItem = '[data-testid="network-selector-item"]'
const selectContent = '[data-slot="select-content"]'
const addBtnStr = 'Add'
const settingsBtnStr = 'Settings'
const ownerNameLabel = 'Signer name'

const mandatoryNetworks = [constants.networks.sepolia, constants.networks.polygon, constants.networks.ethereum]

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

export function verifyOnwerInputIsNotEmpty(index) {
  getOwnerNameInput(index).invoke('attr', 'placeholder').should('not.be.empty')
}

export function checkMainNetworkSelected(network) {
  cy.get(sidebar.chainLogo).eq(0).contains(network).should('be.visible')
}

export function verifyMandatoryNetworksExist() {
  main.verifyValuesExist(networkSelectorItem, mandatoryNetworks)
}

export function clickNetworkSelector(networkName) {
  cy.get(safeDataForm).contains(networkName).click()
}

function selectNetwork(networkName) {
  cy.get(networkSelectorItem).contains(networkName).click()
  // Cypress-only: synthetic clicks skip the pointermove that highlights a Base UI select item,
  // so the select never commits/closes and only the item's embedded link navigates. Real user
  // clicks close the popup; here we dismiss it before interacting with the form underneath.
  cy.get('body').type('{esc}')
  cy.get(selectContent).should('not.be.visible')
  cy.get(safeDataForm).contains(networkName)
}

export function selectSepolia() {
  selectNetwork(constants.networks.sepolia)
}

export function selectPolygon() {
  selectNetwork(constants.networks.polygon)
}

export function inputNameAndAddress(name, address) {
  inputName(name)
  inputAddress(address)
}

function inputName(name) {
  cy.get(main.nameInput).type(name, main.nameTypingOptions).should('have.value', name)
}

function inputAddress(address) {
  cy.get(main.addressInput).should('be.visible').clear().should('exist').type(address, { delay: 50 })
}

export function clickOnNextBtn() {
  cy.contains(main.nextBtnStr).click()
}

export function verifyDataInReviewSection(safeName, ownerName, threshold = null, network = null, ownerAddress = null) {
  cy.findByText(safeName).should('be.visible')
  cy.findByText(ownerName).should('be.visible')
  if (ownerAddress !== null) cy.get(safeDataForm).contains(ownerAddress).should('be.visible')
  if (threshold !== null) cy.get(safeDataForm).contains(threshold).should('be.visible')
  if (network !== null) cy.get(sidebar.chainLogo).eq(0).contains(network).should('be.visible')
}

export function clickOnAddBtn() {
  cy.contains('button', addBtnStr).click()
}

export function veriySidebarSafeNameIsVisible(safeName) {
  cy.get('[data-testid="safe-selector-trigger-name"]').should('contain.text', safeName)
}

export function verifyOwnerNamePresentInSettings(ownername) {
  clickOnSettingsBtn()
  cy.contains(ownername).should('exist')
}

function clickOnSettingsBtn() {
  cy.get('aside ul').contains(settingsBtnStr).click()
}
