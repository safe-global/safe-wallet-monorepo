import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as spendinglimit from '../pages/spending_limits.pages'
import * as owner from '../pages/owners.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('[SMOKE] Spending limits tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.ensureSiweSession(signer)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    owner.waitForConnectionStatus()
    cy.get(spendinglimit.spendingLimitsSection).should('be.visible')
    spendinglimit.clickOnNewSpendingLimitBtn()
  })

  it('Verify A valid ENS name is resolved successfully', () => {
    spendinglimit.enterBeneficiaryAddress(constants.ENS_TEST_SEPOLIA)
    spendinglimit.checkBeneficiaryENS(staticSafes.SEP_STATIC_SAFE_6)
  })

  it('Verify writing a valid address shows no errors', () => {
    spendinglimit.enterBeneficiaryAddress(staticSafes.SEP_STATIC_SAFE_6)
    spendinglimit.verifyValidAddressShowsNoErrors()
  })

  it('Verify Amount input cannot be 0', () => {
    spendinglimit.enterSpendingLimitAmount('0')
    spendinglimit.verifyNumberErrorValidation()
  })

  it('Verify Amount input cannot be a negative number', () => {
    spendinglimit.enterSpendingLimitAmount('-1')
    spendinglimit.verifyNumberAmountEntered('1')
  })

  it('Verify Amount input cannot be characters', () => {
    spendinglimit.enterSpendingLimitAmount('abc')
    spendinglimit.verifyNumberAmountEntered('')
  })

  it('Verify any positive number can be set in the amount input', () => {
    spendinglimit.enterSpendingLimitAmount(1)
    spendinglimit.verifyValidAddressShowsNoErrors()
  })

  it('Verify the reset time is "One time" by default', () => {
    spendinglimit.verifyDefaultTimeIsSet()
  })

  it('Validate Reset values present in dropdown: One time, 5 minutes, 30 minutes, 1 hr', () => {
    spendinglimit.clickOnTimePeriodDropdown()
    spendinglimit.checkTimeDropdownOptions()
  })
})
