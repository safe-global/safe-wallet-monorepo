import * as constants from '../../support/constants'
import * as createtx from '../../e2e/pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { acceptCookies2 } from '../pages/main.page.js'

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

describe('[PROD] Create transactions tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    acceptCookies2()
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
  })

  it('Verify submitting a tx and that clicking on notification shows the transaction in queue', () => {
    happyPathToStepTwo()
    createtx.verifySubmitBtnIsEnabled()
    createtx.changeNonce(14)
    cy.wait(1000)
    createtx.clickOnSignTransactionBtn()
    createtx.waitForProposeRequest()
    createtx.clickViewTransaction()
    createtx.verifySingleTxPage()
    createtx.verifyQueueLabel()
    createtx.verifyTransactionSummary(sendValue)
  })
})
