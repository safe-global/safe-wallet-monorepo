import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createWallet from '../pages/create_wallet.pages'
import * as navigation from '../pages/navigation.page'

const tooltipLabel = (label) => `span[aria-label="${label}"]`
const removeOwnerBtn = 'span[data-track="settings: Remove owner"] > span > button'
const tooltip = 'div[role="tooltip"]'
const expandMoreIcon = 'svg[data-testid="ExpandMoreIcon"]'
const addNewSigner = '[data-testid="add-new-signer"]'
const newOwnerName = 'input[name="newOwner.name"]'
const newOwnerAddress = 'input[name="newOwner.address"]'
const newOwnerNonceInput = 'input[name="nonce"]'
const signerNameField = '[data-testid="owner-name"]'
const signerAddressField = 'input[name="owners.0.address"]'
const thresholdDropdown = '[data-testid="threshold-selector"]'
const existingOwnerAddressInput = (index) => `input[name="owners.${index}.address"]`
const manageSignersBtn = '[data-testid="manage-signers-btn"]'
const submitNextBt = '[data-testid="submit-next"]'
const addOwnerNextBtn = '[data-testid="add-owner-next-btn"]'
const modalHeader = '[data-testid="modal-header"]'

const disconnectBtnStr = 'Disconnect'
const notConnectedStatus = 'Connect'
const continueBtnStr = 'Continue'
const backbtnStr = 'Back'

export const safeAccountNonceStr = 'Safe account nonce'
export const nonOwnerErrorMsg = 'Your connected wallet is not a signer of this Safe account'

export function clickOnThresholdDropdown() {
  cy.get(thresholdDropdown).eq(0).click()
}

export function verifyTooltipLabel(label) {
  cy.get(tooltipLabel(label)).should('be.visible')
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

//Type owner address on the manage signers form
export function typeOwnerAddress(address) {
  cy.get(newOwnerAddress)
    .clear()
    .type(address)
    .then(($input) => {
      const typedValue = $input.val()
      expect(address).to.contain(typedValue)
    })
}
//Type the signer address into the 'Signer Address' field on the Manage Signers page, defined by the index (owners.index.address)
export function typeOwnerAddressManage(index, address) {
  cy.get(existingOwnerAddressInput(index)).clear().type(address)
}
//Type the signer name for one field pages
export function typeOwnerName(name) {
  cy.get(newOwnerName).clear().type(name, main.nameTypingOptions)
  main.verifyInputValue(newOwnerName, name)
}

//Type the signer name into the "Signer Name" field for manage signers
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
