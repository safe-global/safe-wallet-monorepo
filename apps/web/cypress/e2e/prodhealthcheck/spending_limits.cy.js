import * as constants from '../../support/constants'
import * as spendinglimit from '../pages/spending_limits.pages'
import * as navigation from '../pages/navigation.page'
import * as tx from '../pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const tokenAmount = 0.1

describe('[PROD] Spending limits tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.setupUrl + staticSafes.SEP_STATIC_SAFE_8)
    cy.contains(createTx.settingsStr, { timeout: 10000 })
    closeSecurityNotice()
    cy.get(spendinglimit.spendingLimitsSection).should('be.visible')
    acceptCookies2()
  })

  it('Verify that the Review step shows beneficiary, amount allowed, reset time', () => {
    //Assume that default reset time is set to One time
    wallet.connectSigner(signer)
    spendinglimit.clickOnNewSpendingLimitBtn()
    spendinglimit.enterBeneficiaryAddress(getMockAddress())
    spendinglimit.enterSpendingLimitAmount(0.1)
    spendinglimit.clickOnNextBtn()
    spendinglimit.checkReviewData(
      tokenAmount,
      getMockAddress(),
      spendinglimit.timePeriodOptions.oneTime.split(' ').join('-'),
    )
  })

  it('Verify values and trash icons are displayed in Beneficiary table', () => {
    spendinglimit.verifyBeneficiaryTable()
  })

  it('Verify Spending limit option is available when selecting the corresponding token', () => {
    wallet.connectSigner(signer)
    navigation.clickOnNewTxBtn()
    tx.clickOnSendTokensBtn()
    spendinglimit.verifyTxOptionExist([spendinglimit.spendingLimitTxOption])
  })
})
