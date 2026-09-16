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
const addNewSigner = '[data-testid="add-new-signer"]'
const newOwnerName = 'input[name="newOwner.name"]'
const newOwnerAddress = 'input[name="newOwner.address"]'
const newOwnerNonceInput = 'input[name="nonce"]'
const signerNameField = '[data-testid="owner-name"]'
const signerAddressField = 'input[name="owners.0.address"]'
const thresholdList = '[data-slot="select-content"]'
const thresholdDropdown = '[data-testid="threshold-selector"]'
const thresholdOption = '[data-slot="select-item"]'
const existingOwnerAddressInput = (index) => `input[name="owners.${index}.address"]`
const existingOwnerNameInput = (index) => `input[name="owners.${index}.name"]`
const singleOwnerNameInput = 'input[name="name"]'
const manageSignersBtn = '[data-testid="manage-signers-btn"]'
const submitNextBt = '[data-testid="submit-next"]'
const addOwnerNextBtn = '[data-testid="add-owner-next-btn"]'
const modalHeader = '[data-testid="modal-header"]'
const addressToBeRemoved = '[aria-label="Copy to clipboard"] span'
const addressRegex = /0x[0-9a-fA-F]{40}/
const txModalDialog = '[role="dialog"]:visible'
const thresholdNextBtn = '[data-testid="threshold-next-btn"]'
const signerList = '[data-testid="signer-list"]'

const disconnectBtnStr = 'Disconnect'
const notConnectedStatus = 'Connect'
const continueBtnStr = 'Continue'
const backbtnStr = 'Back'
const removeOwnerStr = 'Remove signer'
const removedOwnerSectionStr = 'Remove owner'
const selectedOwnerStr = 'Signers'
const changeThresholdStr = 'Change threshold'

export const safeAccountNonceStr = 'Safe account nonce'
export const nonOwnerErrorMsg = 'Your connected wallet is not a signer of this Safe account'
export const disconnectedUserErrorMsg = 'Please connect your wallet'

export function checkExistingSignerCount(count) {
  cy.get(signerList).find(addressBook.tableRow).should('have.length', count)
}

export function checkExistingSignerAddress(index, address) {
  cy.get(signerList).find(addressBook.tableRow).eq(index).should('contain.text', address)
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
  return cy.get(thresholdList).find(thresholdOption)
}

export function selectThresholdOption(index) {
  // Base UI select items only commit a click once highlighted; hover first so the
  // highlight renders before the click lands.
  getThresholdOptions().eq(index).trigger('mousemove').click()
}

export function verifyThresholdLimit(startValue, endValue) {
  cy.get('p').contains(`out of ${endValue} signer${endValue > 1 ? 's' : ''}`)
  clickOnThresholdDropdown()
  getThresholdOptions().eq(0).should('have.text', startValue)
  selectThresholdOption(0)
}

export function verifyRemoveBtnIsEnabled() {
  return cy.get(removeOwnerBtn).should('exist')
}

export function verifyRemoveBtnIsDisabled() {
  return cy.get(removeOwnerBtn).should('exist').and('be.disabled')
}

export function openRemoveOwnerWindow(btn) {
  const minimumCount = btn === 0 ? 1 : btn
  main.verifyMinimumElementsCount(removeOwnerBtn, minimumCount)
  cy.get(removeOwnerBtn).eq(btn).should('be.enabled').click({ force: true })
  cy.get('div').contains(removeOwnerStr).should('exist')
}

export function getAddressToBeRemoved() {
  cy.get(txModalDialog)
    .contains('p', removedOwnerSectionStr)
    .parent()
    .find(addressToBeRemoved)
    .first()
    .invoke('text')
    .then((address) => {
      expect(address, 'removed owner address').to.match(addressRegex)
      cy.wrap(address).as('removedAddress')
    })
}

export function openReplaceOwnerWindow(index) {
  const minimumCount = index === 0 ? 1 : index
  main.verifyMinimumElementsCount(replaceOwnerBtn, minimumCount)
  cy.get(replaceOwnerBtn).eq(index).should('be.enabled').click({ force: true })
  cy.get(newOwnerName).should('be.visible')
  cy.get(newOwnerAddress).should('be.visible')
}
export function verifyTooltipLabel(label) {
  cy.get(tooltipLabel(label)).should('be.visible')
}
export function verifyReplaceBtnIsEnabled() {
  cy.get(replaceOwnerBtn).should('exist')
  main.verifyBtnIsEnabled(replaceOwnerBtn)
}

export function verifyReplaceBtnIsDisabled() {
  cy.get(replaceOwnerBtn).should('exist')
  main.verifyBtnIsDisabled(replaceOwnerBtn)
}

export function verifyManageSignersBtnIsEnabled() {
  cy.get(manageSignersBtn).should('exist')
  main.verifyBtnIsEnabled(manageSignersBtn)
}

export function verifyManageSignersBtnIsDisabled() {
  cy.get(manageSignersBtn).should('exist')
  main.verifyBtnIsDisabled(manageSignersBtn)
}

export function hoverOverManageSignersBtn() {
  cy.get(manageSignersBtn).trigger('mouseover')
}

export function verifyTooltiptext(text) {
  cy.get(tooltip).should('have.text', text)
}

export function clickOnWalletExpandMoreIcon() {
  cy.get('[data-testid="open-account-center"]').click()
}

export function clickOnDisconnectBtn() {
  cy.get('button').contains(disconnectBtnStr).click()
  cy.get('button').contains(notConnectedStatus)
}

export function waitForConnectionStatus() {
  cy.get(createWallet.accountInfoHeader).should('exist')
}

export function clickOnManageSignersBtn() {
  cy.get(manageSignersBtn).should('be.enabled').click()
}
export function openManageSignersWindow() {
  clickOnManageSignersBtn()
  cy.get(signerNameField).should('be.visible')
  cy.get(signerAddressField).should('be.visible')
}
export function clickOnAddSignerBtn() {
  cy.get(addNewSigner).should('be.enabled').click()
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
//Type owner address on the manage signers form
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
//Type the signer address into the 'Signer Address' field on the Manage Signers page, defined by the index (owners.index.address)
export function typeOwnerAddressManage(index, address) {
  cy.get(existingOwnerAddressInput(index)).clear().type(address)
}
//Type the signer name for one field pages
export function typeOwnerName(name) {
  cy.get(newOwnerName).clear().type(name)
  main.verifyInputValue(newOwnerName, name)
}

//Type the signer name into the "Signer Name" field for manage signers
export function typeOwnerNameManage(index, name) {
  cy.get(existingOwnerNameInput(index)).clear().type(name)
  main.verifyInputValue(existingOwnerNameInput(index), name)
}

export function verifyNewOwnerName(name) {
  cy.get(addressBook.addressBookRecipient).should('include.text', name)
}
//next button on Manage signers
export function clickOnNextBtnManage() {
  main.clickOnNextBtn(submitNextBt)
}
//Next button for usual tx flow
export function clickOnNextBtn() {
  main.clickOnNextBtn(addOwnerNextBtn)
}

export function clickOnBackBtn() {
  main.clickOnBackBtn(navigation.modalBackBtn)
}

export function verifyConfirmTransactionWindowDisplayed() {
  cy.get('div').contains(constants.transactionStatus.confirm).should('exist')
  cy.get('button').contains(continueBtnStr).should('exist')
  cy.get('button').contains(backbtnStr).should('exist')
}

export function verifyThreshold(startValue, endValue) {
  cy.get(thresholdDropdown).should('contain.text', startValue)
  cy.get('p')
    .contains(`out of ${endValue} signer${endValue > 1 ? 's' : ''}`)
    .should('be.visible')
  cy.get(thresholdDropdown).click()
  cy.get(thresholdList).contains(endValue).should('be.visible')
  cy.get(thresholdList).find(thresholdOption).should('have.length', endValue)
  cy.get('body').type('{esc}')
  cy.get(thresholdList).should('not.be.visible')
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

export function verifyInconsistentSignersWarning(network) {
  cy.contains(
    `Signers are not consistent across networks on this account. Changing signers will only affect the account on ${network}`,
  ).should('exist')
}
