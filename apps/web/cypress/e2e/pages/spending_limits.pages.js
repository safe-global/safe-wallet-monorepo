import * as constants from '../../support/constants'
import * as main from './main.page'
import * as addressBook from '../pages/address_book.page'
import { invalidAddressFormatErrorMsg } from '../pages/load_safe.pages'
import * as ls from '../../support/localstorage_data.js'
import 'cypress-file-upload'

export const spendingLimitsSection = '[data-testid="spending-limit-section"]'
export const newSpendingLimitBtn = '[data-testid="new-spending-limit"]'
const beneficiarySection = '[data-testid="beneficiary-section"]'
const tokenAmountFld = '[data-testid="token-amount-field"]'
const tokenAmountSection = '[data-testid="token-amount-section"]'
const modalTitle = '[data-testid="modal-title"]'
const timePeriodSection = '[data-testid="time-period-section"]'
const timePeriodItem = '[data-testid="time-period-item"]'
const nextBtn = '[data-testid="next-btn"]'
const reviewTokenAmountFld = '[data-testid="token-amount"]'
const reviewBeneficiaryAddressFld = '[data-testid="beneficiary-address"]'
const reviewSpendingLimit = '[data-testid="spending-limit-label"]'
const deleteBtn = '[data-testid="delete-btn"]'
const resetTimeInfo = '[data-testid="reset-time"]'
const spentAmountInfo = '[data-testid="spent-amount"]'
export const spendingLimitTxOption = '[data-testid="spending-limit-tx"]'
export const standardTx = '[data-testid="standard-tx"]'
const tokenBalance = '[data-testid="token-balance"]'
const tokenItem = '[data-testid="token-item"]'
const maxBtn = '[data-testid="max-btn"]'
const nonceFld = '[data-testid="nonce-fld"]'
const splimitBeneficiaryIcon = '[data-testid="beneficiary-icon"]'
const splimitAssetIcon = '[data-testid="asset-icon"]'
const splimitTimeIcon = '[data-testid="time-icon"]'
const oldTokenAmount = '[data-testid="old-token-amount"]'
const oldResetTime = '[data-testid="old-reset-time"]'
const slimitReplacementWarning = '[data-testid="limit-replacement-warning"]'
const addressItem = '[data-testid="address-item"]'
const allActionsSection = '[data-testid="all-actions"]'
const actionItem = '[data-testid="action-item"]'
const decodedTxSummary = '[data-testid="decoded-tx-summary"]'

const actionSectionItem = () => {
  return cy.get('[data-testid="CodeIcon"]').parent()
}

export const timePeriodOptions = {
  oneTime: 'One time',
  fiveMin: '5 minutes',
  thirtyMin: '30 minutes',
  oneHr: '1 hour',
}

const getBeneficiaryInput = () => cy.get(beneficiarySection).find('input').should('be.enabled')
const automationOwner = ls.addressBookData.sepoliaAddress2[11155111]['0xC16Db0251654C0a72E91B190d81eAD367d2C6fED']

export const actionNames = {
  resetAllowance: 'resetAllowance',
  setAllowance: 'setAllowance',
}

const expectedSpendOptions = ['0.02 of 0.17 ETH', '0.00001 of 0.05 ETH', '0 of 0.01 ETH']
const expectedResetOptions = new Array(3).fill('One-time')

const newTransactionStr = 'New transaction'
const confirmTxStr = 'Confirm transaction'
const invalidNumberErrorStr = 'The value must be greater than 0'
const invalidCharErrorStr = 'The value must be a number'

export function selectRecipient(recipient) {
  cy.get(addressItem).contains(recipient).click()
  main.verifyValuesExist(addressBook.addressBookRecipient, [recipient, automationOwner])
}

export function verifyOldValuesAreDisplayed() {
  main.verifyElementsIsVisible([oldTokenAmount, oldResetTime, slimitReplacementWarning])
}

export function verifyActionNamesAreDisplayed(names) {
  main.verifyValuesExist(actionSectionItem, names)
}

export function verifySpendingLimitBtnIsDisabled() {
  cy.get(newSpendingLimitBtn).should('be.disabled')
}

export function verifySpendingLimitsIcons() {
  main.verifyElementsIsVisible([splimitBeneficiaryIcon, splimitAssetIcon, splimitTimeIcon])
}

export function clickOnTokenDropdown() {
  cy.get(tokenBalance).click()
}
export function verifyMandatoryTokensExist() {
  main.verifyValuesExist(tokenItem, [constants.tokenNames.sepoliaEther, constants.tokenNames.qaToken])
}

export function selectToken(token) {
  clickOnTokenDropdown()
  cy.get(tokenItem).contains(token).click()
  main.verifyValuesExist(tokenBalance, [token])
}

export function checkMaxValue() {
  const maxValue = []

  main.extractDigitsToArray(tokenBalance, maxValue)
  cy.get(tokenAmountFld)
    .find('input')
    .invoke('val')
    .then((value) => {
      expect(maxValue).to.contain(value)
    })
}

export function verifyNonceState(state) {
  if (state === constants.elementExistanceStates.exist) {
    cy.get(nonceFld).should(constants.elementExistanceStates.exist)
  }
  cy.get(nonceFld).should(constants.elementExistanceStates.not_exist)
}

export function clickOnMaxBtn() {
  cy.get(maxBtn).click()
}

export function selectSpendingLimitOption() {
  cy.get(spendingLimitTxOption).click()
  cy.get(spendingLimitTxOption).find('input').should('be.checked')
}

export function selectStandardOption() {
  cy.get(standardTx).click()
  cy.get(standardTx).find('input').should('be.checked')
}

export function verifyTxOptionExist(options) {
  main.verifyElementsIsVisible(options)
}

export function verifySpendingOptionShowsBalance(balance) {
  main.verifyValuesExist(spendingLimitTxOption, [balance])
}

export function verifyBeneficiaryTable() {
  main.checkTextOrder(spentAmountInfo, expectedSpendOptions)
  main.checkTextOrder(resetTimeInfo, expectedResetOptions)
  main.verifyElementsCount(deleteBtn, 3)
}
export function checkReviewData(tokenAmount, address, spendingLimit) {
  cy.get(reviewTokenAmountFld).should('have.text', tokenAmount)
  cy.get(reviewBeneficiaryAddressFld).should('contain', address)
  cy.get(reviewSpendingLimit).should('contain', spendingLimit)
}
export function clickOnNextBtn() {
  cy.get(nextBtn).click()
  cy.get(modalTitle).should('have.text', confirmTxStr)
}

export function clickOnTimePeriodDropdown() {
  cy.get(timePeriodSection).click()
}

export function selectTimePeriod(period) {
  cy.get(timePeriodItem).contains(period).click()
}

export function checkTimeDropdownOptions() {
  cy.get(timePeriodItem).then(($lis) => {
    const displayedOptions = Array.from($lis, (li) => li.textContent.trim())

    const expectedOptions = Object.values(timePeriodOptions).every((option) => displayedOptions.includes(option))
    expect(expectedOptions).to.be.true
  })
}

export function verifyDefaultTimeIsSet() {
  cy.get(timePeriodSection).scrollIntoView().find('div').contains(timePeriodOptions.oneTime).should('be.visible')
}

export function clickOnNewSpendingLimitBtn() {
  cy.get(newSpendingLimitBtn).click()
  cy.get(modalTitle).should('have.text', newTransactionStr)
}

export function enterSpendingLimitAmount(amount) {
  cy.get(tokenAmountFld).find('input').clear().type(amount)
}

export function enterBeneficiaryAddress(address) {
  getBeneficiaryInput().clear().type(address)
}

export function checkBeneficiaryInputValue(value) {
  getBeneficiaryInput().invoke('val').should('contain', value)
}

export function checkBeneficiaryENS(ens) {
  getBeneficiaryInput().invoke('val').should('contain', ens.substring(4))
}

export function verifyValidAddressShowsNoErrors() {
  cy.get(beneficiarySection)
    .find('label')
    .should('not.contain', invalidAddressFormatErrorMsg)
    .and('not.contain', invalidCharErrorStr)
}

export function verifyNumberErrorValidation() {
  cy.get(tokenAmountSection).find('label').should('contain', invalidNumberErrorStr)
}

export function verifyCharErrorValidation() {
  cy.get(tokenAmountSection).find('label').should('contain', invalidCharErrorStr)
}

export function verifyNumberAmountEntered(amount) {
  cy.get(tokenAmountFld).find('input').should('have.value', amount)
}

export function verifyActionCount(count) {
  main.verifyElementsCount(actionItem, count)
}

export function verifyActionNames(names) {
  cy.get(allActionsSection)
    .parent()
    .within(() => {
      names.forEach((item) => {
        cy.contains(item)
      })
    })
}

export function verifyDecodedTxSummary(names) {
  cy.get(decodedTxSummary).within(() => {
    names.forEach((item) => {
      cy.contains(item)
    })
  })
}
