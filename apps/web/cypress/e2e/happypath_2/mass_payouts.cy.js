import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let staticSafes = []

const sendValue2 = 0.0001

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer2 = walletCredentials.OWNER_1_PRIVATE_KEY

describe('Mass payouts happy path tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that proposer can create a mass payout tx', () => {
    const address1 = getMockAddress()
    const address2 = getMockAddress()

    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_42)
    wallet.connectSigner(signer2)
    cy.wait(5000)
    createtx.deleteAllTx()

    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_42)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.clickOnAddRecipientBtn()
    createtx.typeRecipientAddress_(0, address1)
    createtx.typeRecipientAddress_(1, address2)
    createtx.setSendValue_(0, sendValue2)
    createtx.setSendValue_(1, sendValue2)
    createtx.clickOnNextBtn()
    createtx.clickOnContinueSignTransactionBtn()
    createtx.clickOnProposeTransactionBtn()
    createtx.clickViewTransaction()
    main.verifyValuesExist(createtx.transactionItem, [createtx.tx_status.proposal])
  })
})
