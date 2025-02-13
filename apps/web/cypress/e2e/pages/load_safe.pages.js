import * as constants from '../../support/constants'
import * as sidebar from '../pages/sidebar.pages'
import * as main from '../pages/main.page'
import { addressBookRecipient } from '../pages/address_book.page'

const addExistingAccountBtnStr = 'Add existing one'
const contactStr = 'Choose address, network and a name'
export const invalidAddressFormatErrorMsg = 'Invalid address format'
const invalidAddressNameLengthErrorMsg = 'Maximum 50 symbols'

const safeDataForm = '[data-testid=load-safe-form]'
const removeOwnerBtn = '[data-testid="remove-owner-btn"]'
const addOwnerBtn = '[data-testid="add-owner-btn"]'
const ownerPolicyStepForm = '[data-testid="owner-policy-step-form"]'
const addressItem = '[data-testid="address-item"]'
const nameInput = 'input[name="name"]'
const addressInput = 'input[name="address"]'
const sideBarIcon = '[data-testid="ChevronRightIcon"]'
const sidebarCheckIcon = '[data-testid="CheckIcon"]'
const addressStepNextBtn = '[data-testid="load-safe-next-btn"]'
const typeFile = '[type="file"]'
const ownerName = '[data-testid="owner-name"]'
const addressSection = '[data-testid="address-section"]'
const nextBtnStr = 'Next'
const addBtnStr = 'Add'
const settingsBtnStr = 'Settings'
const ownersConfirmationsStr = 'Owners and confirmations'
const transactionStr = 'Transactions'
const qrErrorMsg = 'The QR could not be read'
const safeAddressError = 'Address given is not a valid Safe Account address'
const ownerNameLabel = 'Signer name'

const mandatoryNetworks = [constants.networks.sepolia, constants.networks.polygon, constants.networks.ethereum]

export function verifyAddresFormatIsValid() {
  cy.get(addressSection).find('label').contains(constants.addressBookErrrMsg.invalidFormat).should('not.exist')
}

export function clickOnAddNewOwnerBtn() {
  cy.get(addOwnerBtn).click()
}

export function verifyOnwerName(index, name) {
  cy.get(ownerName).eq(index).find('input').should('have.value', name)
  cy.get(addressBookRecipient).eq(index).should('contain', name)
}

export function pasteAddress(index, address) {
  cy.get(addressItem)
    .eq(index)
    .find('input')
    .invoke('val', address)
    .wait(1000)
    .trigger('input')
    .wait(1000)
    .trigger('change')
}

export function verifyNumberOfOwners(owners) {
  cy.get(addressItem).should('have.length', owners)
  cy.get(ownerName).should('have.length', owners)
}

export function verifyOwnerAddress(index, address) {
  cy.get(addressItem).eq(index).find('input').should('have.value', address)
}

export function clickOnRemoveOwnerBtn(index) {
  cy.get(removeOwnerBtn).eq(index).click()
}

export function verifyownerNameFormatIsValid() {
  cy.get(ownerName).find('label').contains(ownerNameLabel).should('be.visible')
}

export function clickOnBackBtn() {
  cy.get('button').contains('Back').click()
}
export function verifyAddressCheckSum(address) {
  inputAddress(main.formatAddressInCaps(address))
}
export function verifyOwnerNames(names) {
  main.verifyValuesExist(safeDataForm, names)
}

export function verifyOwnerNamesInConfirmationStep(names) {
  main.verifyValuesExist(ownerPolicyStepForm, names)
}

export function verifyDataDoesNotExist(data) {
  main.verifyValuesDoNotExist(ownerPolicyStepForm, data)
}

export function inputOwnerName(index, name) {
  cy.get(ownerName)
    .eq(index)
    .find('input')
    .clear()
    .type(name)
    .then(($input) => {
      const typedValue = $input.val()
      expect(name).to.contain(typedValue)
    })
}

export function clearOwnerAddress(index) {
  cy.get(addressItem).eq(index).find('input').clear()
}

export function inputOwnerAddress(index, name) {
  cy.wait(500)
  cy.get(addressItem)
    .eq(index)
    .find('input')
    .clear()
    .type(name)
    .then(($input) => {
      const typedValue = $input.val()
      expect(name).to.contain(typedValue)
    })
}

export function verifyOnwerNameENS(index, ens) {
  cy.get(ownerName).eq(index).find('input').invoke('attr', 'placeholder').should('contain', ens)
}

export function verifyAddressError() {
  cy.get(addressSection).find('label').contains(safeAddressError)
}

export function verifyOnwerInputIsNotEmpty(index) {
  cy.get(ownerName).find('input').eq(index).invoke('attr', 'placeholder').should('not.be.empty')
}

export function checkMainNetworkSelected(network) {
  cy.get(sidebar.chainLogo).eq(0).contains(network).should('be.visible')
}

export function verifyMandatoryNetworksExist() {
  main.verifyValuesExist('ul li', mandatoryNetworks)
}

export function verifyQRCodeErrorMsg() {
  cy.contains(qrErrorMsg).should('be.visible')
}

export function openLoadSafeForm() {
  cy.contains('a', addExistingAccountBtnStr).click()
  cy.contains(contactStr)
}

export function clickNetworkSelector(networkName) {
  cy.get(safeDataForm).contains(networkName).click()
}

export function selectGoerli() {
  cy.get('ul li').contains(constants.networks.goerli).click()
  cy.contains('span', constants.networks.goerli)
}

export function selectSepolia() {
  cy.get('ul li').contains(constants.networks.sepolia).click()
  cy.contains('span', constants.networks.sepolia)
}

export function selectEth() {
  cy.get('ul li').contains(constants.networks.ethereum).click()
  cy.contains('span', constants.networks.ethereum)
}

export function selectPolygon() {
  cy.get('ul li').contains(constants.networks.polygon).click()
  cy.contains('span', constants.networks.polygon)
}

export function inputNameAndAddress(name, address) {
  inputName(name)
  inputAddress(address)
}

export function inputName(name) {
  cy.get(nameInput).type(name).should('have.value', name)
}

export function verifyIncorrectAddressErrorMessage() {
  inputAddress('Random text')
  cy.get(addressInput).parent().prev('label').contains(invalidAddressFormatErrorMsg)
}

export function verifyNameLengthErrorMessage() {
  cy.get(nameInput).parent().prev('label').contains(invalidAddressNameLengthErrorMsg)
}

export function inputAddress(address) {
  cy.get(addressInput).should('be.visible').clear().should('exist').type(address, { delay: 50 })
}

export function verifyAddressInputValue(safeAddress) {
  // The address field should be filled with the "bare" QR code's address
  const [, address] = safeAddress.split(':')
  cy.get(addressInput).should('have.value', address)
}

export function clickOnNextBtn() {
  cy.contains(nextBtnStr).click()
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
  cy.get('aside').contains(safeName).should('be.visible')
}

export function verifyOwnerNamePresentInSettings(ownername) {
  clickOnSettingsBtn()
  cy.contains(ownername).should('exist')
}

function clickOnSettingsBtn() {
  cy.get('aside ul').contains(settingsBtnStr).click()
}

export function verifyOwnersModalIsVisible() {
  cy.contains(ownersConfirmationsStr).should('be.visible')
}

export function openSidebar() {
  cy.get('aside').within(() => {
    cy.get(sideBarIcon).click({ force: true })
  })
}

export function verifyAddressInsidebar(address) {
  cy.get('li').within(() => {
    cy.contains(address).should('exist')
  })
}

export function verifySidebarIconNumber(number) {
  cy.get(sidebarCheckIcon).next().contains(number).should('exist')
}

export function clickOnPendingActions() {
  cy.get(sidebarCheckIcon).next().click()
}

export function verifyTransactionSectionIsVisible() {
  cy.contains('h3', transactionStr).should('be.visible')
}

export function verifyNumberOfTransactions(startNumber, endNumber) {
  cy.get(`span:contains("${startNumber} out of ${endNumber}")`).should('have.length', 1)
}

export function verifyNextButtonStatus(param) {
  cy.get(addressStepNextBtn).should(param)
}
