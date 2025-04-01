import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createtx from '../../e2e/pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as tx from '../../e2e/pages/transactions.page'

let staticSafes = []

const sendValue = 0.00002

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

function happyPathToStepTwo() {
  createtx.typeRecipientAddress(constants.EOA)
  createtx.clickOnTokenselectorAndSelectSepoliaEth()
  createtx.setSendValue(sendValue)
  createtx.clickOnNextBtn()
}

describe('Create transactions tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  // Added to prod
  it('Verify submitting a tx and that clicking on notification shows the transaction in queue', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.verifySubmitBtnIsEnabled()
    createtx.changeNonce(14)
    cy.wait(1000)
    createtx.clickOnContinueSignTransactionBtn()
    createtx.clickOnAcknowledgement()
    createtx.clickOnSignTransactionBtn()
    createtx.clickViewTransaction()
    createtx.verifySingleTxPage()
    createtx.verifyQueueLabel()
    createtx.verifyTransactionSummary(sendValue)
  })

  it('Verify relay is available on tx execution', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.BALANCE_URL + safe)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.clickOnContinueSignTransactionBtn()
    cy.contains(tx.relayRemainingAttemptsStr).should('exist')
  })
})
