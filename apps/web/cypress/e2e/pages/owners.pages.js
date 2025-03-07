import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createWallet from '../pages/create_wallet.pages'
import * as navigation from '../pages/navigation.page'
import * as addressBook from '../pages/address_book.page'

const tooltipLabel = (label) => `span[aria-label="${label}"]`
export const removeOwnerBtn = 'span[data-track="settings: Remove owner"] > span > button'
const replaceOwnerBtn = 'span[data-track="settings: Replace owner"] > span > button'
const changeThresholdBtn = 'span[data-track="settings: Change threshold"] > button'
const tooltip = 'div[role="tooltip"]'
const expandMoreIcon = 'svg[data-testid="ExpandMoreIcon"]'
const sentinelStart = 'div[data-testid="sentinelStart"]'
const newOwnerName = 'input[name="newOwner.name"]'
const newOwnerAddress = 'input[name="newOwner.address"]'
const newOwnerNonceInput = 'input[name="nonce"]'
const thresholdInput = 'input[name="threshold"]'
const thresHoldDropDownIcon = 'svg[data-testid="ArrowDropDownIcon"]'
const thresholdList = 'ul[role="listbox"]'
const thresholdDropdown = '[data-testid="threshold-selector"]'
const thresholdOption = 'li[role="option"]'
const existingOwnerAddressInput = (index) => `input[name="owners.${index}.address"]`
const existingOwnerNameInput = (index) => `input[name="owners.${index}.name"]`
const singleOwnerNameInput = 'input[name="name"]'
const finishTransactionBtn = '[data-testid="finish-transaction-btn"]'
const addOwnerBtn = '[data-testid="add-owner-btn"]'
const addOwnerNextBtn = '[data-testid="add-owner-next-btn"]'
const modalHeader = '[data-testid="modal-header"]'
const addressToBeRemoved = '[aria-label="Copy to clipboard"] span'
const thresholdNextBtn = '[data-testid="threshold-next-btn"]'

const disconnectBtnStr = 'Disconnect'
const notConnectedStatus = 'Connect'
const e2eWalletStr = 'E2E Wallet'
const max50charsLimitStr = 'Maximum 50 symbols'
const executeBtnStr = 'Execute'
const backbtnStr = 'Back'
const removeOwnerStr = 'Remove signer'
const selectedOwnerStr = 'Selected signer'
const addNewOwnerStr = 'Add new signer'
const processedTransactionStr = 'Transaction was successful'
const changeThresholdStr = 'Change threshold'

export const safeAccountNonceStr = 'Safe Account nonce'
export const nonOwnerErrorMsg = 'Your connected wallet is not a signer of this Safe Account'
export const disconnectedUserErrorMsg = 'Please connect your wallet'

export function verifyOwnerTransactionComplted() {
  cy.get(processedTransactionStr).should('exist')
  cy.get(finishTransactionBtn).should('exist')
}
export function verifyNumberOfOwners(count) {
  const indices = Array.from({ length: count }, (_, index) => index)
  const names = indices.map(existingOwnerNameInput)
  const addresses = indices.map(existingOwnerAddressInput)

  names.forEach((selector) => {
    cy.get(selector).should('have.length', 1)
  })

  addresses.forEach((selector) => {
    cy.get(selector).should('have.length', 1)
  })
}

export function verifyExistingOwnerAddress(index, address) {
  cy.get(existingOwnerAddressInput(index)).should('have.value', address)
}

export function typeOwnerAddressCreateSafeStep(index, address) {
  cy.get(existingOwnerAddressInput(index)).clear().type(address)
}

export function verifyExistingOwnerName(index, name) {
  cy.get(existingOwnerNameInput(index)).should('have.value', name)
}

export function typeExistingOwnerName(name) {
  cy.get(singleOwnerNameInput).clear().type(name)
  main.verifyInputValue(singleOwnerNameInput, name)
}

export function verifyOwnerDeletionWindowDisplayed() {
  cy.get('div').contains(constants.transactionStatus.confirm).should('exist')
  cy.get('button').contains(backbtnStr).should('exist')
  cy.get('p').contains(selectedOwnerStr)
}

export function clickOnThresholdDropdown() {
  cy.get(thresholdDropdown).eq(0).click()
}

export function getThresholdOptions() {
  return cy.get('ul').find(thresholdOption)
}

export function verifyThresholdLimit(startValue, endValue) {
  cy.get('p').contains(`out of ${endValue} signer${endValue > 1 ? 's' : ''}`)
  clickOnThresholdDropdown()
  getThresholdOptions().eq(0).should('have.text', startValue).click()
}

export function verifyRemoveBtnIsEnabled() {
  return cy.get(removeOwnerBtn).should('exist')
}

export function verifyRemoveBtnIsDisabled() {
  return cy.get(removeOwnerBtn).should('exist').and('be.disabled')
}

export function hoverOverDeleteOwnerBtn(index) {
  cy.get(removeOwnerBtn).eq(index).trigger('mouseover', { force: true })
}

export function openRemoveOwnerWindow(btn) {
  const minimumCount = btn === 0 ? 1 : btn
  main.verifyMinimumElementsCount(removeOwnerBtn, minimumCount)
  cy.get(removeOwnerBtn).eq(btn).click({ force: true })
  cy.get('div').contains(removeOwnerStr).should('exist')
}

export function getAddressToBeRemoved() {
  let removedAddress
  cy.get(modalHeader)
    .next()
    .should('exist')
    .find(addressToBeRemoved)
    .first()
    .invoke('text')
    .then((value) => {
      removedAddress = value
      cy.wrap(removedAddress).as('removedAddress')
    })
  return removedAddress
}

export function openReplaceOwnerWindow(index) {
  const minimumCount = index === 0 ? 1 : index
  main.verifyMinimumElementsCount(replaceOwnerBtn, minimumCount)
  cy.get(replaceOwnerBtn).eq(index).click({ force: true })
  cy.get(newOwnerName).should('be.visible')
  cy.get(newOwnerAddress).should('be.visible')
}
export function verifyTooltipLabel(label) {
  cy.get(tooltipLabel(label)).should('be.visible')
}
export function verifyReplaceBtnIsEnabled() {
  cy.get(replaceOwnerBtn).should('exist').and('not.be.disabled')
}

export function verifyReplaceBtnIsDisabled() {
  cy.get(replaceOwnerBtn).should('exist').and('be.disabled')
}

export function hoverOverReplaceOwnerBtn() {
  cy.get(replaceOwnerBtn).trigger('mouseover', { force: true })
}

export function verifyAddOwnerBtnIsEnabled() {
  cy.get(addOwnerBtn).should('exist').and('not.be.disabled')
}

export function verifyAddOwnerBtnIsDisabled() {
  cy.get(addOwnerBtn).should('exist').and('be.disabled')
}

export function hoverOverAddOwnerBtn() {
  cy.get(addOwnerBtn).trigger('mouseover')
}

export function verifyTooltiptext(text) {
  cy.get(tooltip).should('have.text', text)
}

export function clickOnWalletExpandMoreIcon() {
  cy.get(expandMoreIcon).eq(0).click({ force: true })
  cy.get(sentinelStart).next().should('be.visible')
}

export function clickOnDisconnectBtn() {
  cy.get('button').contains(disconnectBtnStr).click()
  cy.get('button').contains(notConnectedStatus)
}

export function clickOnConnectBtn() {
  cy.get('button').contains(notConnectedStatus).click().wait(1000)
}

export function waitForConnectionStatus() {
  cy.get(createWallet.accountInfoHeader).should('exist')
}

export function clickOnAddSignerBtn() {
  cy.get(addOwnerBtn).should('be.enabled').click()
}
export function openAddOwnerWindow() {
  clickOnAddSignerBtn()
  cy.get(newOwnerName).should('be.visible')
  cy.get(newOwnerAddress).should('be.visible')
}

export function verifyNonceInputValue(value) {
  cy.get(newOwnerNonceInput).should('not.be.disabled')
  main.verifyInputValue(newOwnerNonceInput, value)
}

export function verifyErrorMsgInvalidAddress(errorMsg) {
  cy.get('label').contains(errorMsg).should('exist')
}

export function verifyValidWalletName(errorMsg) {
  cy.get('label').contains(errorMsg).should('not.exist')
}

export function typeOwnerAddress(address) {
  cy.get(newOwnerAddress)
    .clear()
    .type(address)
    .then(($input) => {
      const typedValue = $input.val()
      expect(address).to.contain(typedValue)
    })
  cy.wait(1000)
}

export function typeOwnerName(name) {
  cy.get(newOwnerName).clear().type(name)
  main.verifyInputValue(newOwnerName, name)
}

export function selectNewOwner(name) {
  cy.contains(name).click()
}

export function verifyNewOwnerName(name) {
  cy.get(addressBook.addressBookRecipient).should('include.text', name)
}

export function clickOnNextBtn() {
  cy.get(addOwnerNextBtn).should('be.enabled').click()
}

export function clickOnBackBtn() {
  cy.get(navigation.modalBackBtn).should('be.enabled').click()
}

export function verifyConfirmTransactionWindowDisplayed() {
  cy.get('div').contains(constants.transactionStatus.confirm).should('exist')
  cy.get('button').contains(executeBtnStr).should('exist')
  cy.get('button').contains(backbtnStr).should('exist')
}

export function verifyThreshold(startValue, endValue) {
  main.verifyInputValue(thresholdInput, startValue)
  cy.get('p')
    .contains(`out of ${endValue} signer${endValue > 1 ? 's' : ''}`)
    .should('be.visible')
  cy.get(thresholdInput).parent().click()
  cy.get(thresholdList).contains(endValue).should('be.visible')
  cy.get(thresholdList).find('li').should('have.length', endValue)
  cy.get('body').click(0, 0)
}

export function clickOnChangeThresholdBtn() {
  cy.get(changeThresholdBtn).click({ force: true })
  cy.get('div').contains(changeThresholdStr).should('exist')
}

export function clickOnThresholdNextBtn() {
  //TODO: Remove extra wait when init sdk is merged
  cy.wait(3000)
  cy.get(thresholdNextBtn).click()
}
