import * as constants from '../../support/constants.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as spendinglimit from '../pages/spending_limits.pages'
import * as navigation from '../pages/navigation.page'
import { getMockAddress } from '../../support/utils/ethers.js'
import { selectToken, selectTokenList, tokenListOptions } from '../pages/assets.pages.js'

let staticSafes = []

const sendValue = 0.00998
const sendValue2 = 0.0001

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Mass payouts tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that the "Add recipient" button is displayed for the targeted safes on New Tx form', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.verifyAddRecipientBtnIsVisible()
  })

  it('Verify that users can add up to 5 recipients', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.checkMaxRecipientReached()
  })

  it('Verify that "Remove recipient" deletes the recipient field', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.clickOnAddRecipientBtn()
    createtx.checkNumberOfRecipients('2/5')
    createtx.clickOnRemoveRecipientBtn(0)
    createtx.checkNumberOfRecipients('1/5')
  })

  it('Verify that "Remove recipient" deletes the recipient field', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_8)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    spendinglimit.selectSpendingLimitOption()
    createtx.verifyAddRecipientBtnDoesNotExist()
  })

  it('Verify the "Max" button sets the full amount', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.clickOnAddRecipientBtn()
    createtx.checkNumberOfRecipients('2/5')
    createtx.clickOnMaxBtn(1)
    createtx.checkTokenValue(1, sendValue)
  })

  it('Verify "insufficient amount" error for the same token during send to a few recipients', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.clickOnAddRecipientBtn()
    createtx.clickOnMaxBtn(0)
    createtx.clickOnMaxBtn(1)
    createtx.checkTokenValue(1, sendValue)
    createtx.insufficientFundsErrorExists(0)
    createtx.insufficientFundsErrorExists(1)
    createtx.insufficientBalanceErrorExists()
  })

  it('Verify recipients are displayed in review tx screen', () => {
    const address1 = getMockAddress()
    const address2 = getMockAddress()

    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.clickOnAddRecipientBtn()
    createtx.typeRecipientAddress_(0, address1)
    createtx.typeRecipientAddress_(1, address2)
    createtx.setSendValue_(0, sendValue2)
    createtx.setSendValue_(1, sendValue2)
    createtx.clickOnNextBtn()
    createtx.recipientAddress(1, address1)
    createtx.recipientAddress(2, address2)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
