import * as constants from '../../support/constants'
import * as createtx from '../../e2e/pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import { walletCredentials } from '../../support/credentials.js'

let staticSafes = []

const sendValue = 0.00002

let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

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
    createtx.cleanTransactionQueue(staticSafes.SEP_STATIC_SAFE_6, signer)
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    happyPathToStepTwo()
    createtx.verifySubmitBtnIsEnabled()
    createtx.changeNonce(14)
    cy.wait(1000)
    createtx.clickOnContinueSignTransactionBtn()
    createtx.clickOnSignTransactionBtn()
    createtx.clickViewTransaction()
    createtx.verifySingleTxPage()
    createtx.verifyQueueLabel()
    createtx.verifyTransactionSummary(sendValue)
  })
})
