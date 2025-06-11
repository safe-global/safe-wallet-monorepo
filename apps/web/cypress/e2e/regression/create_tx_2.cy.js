import * as constants from '../../support/constants.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

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

describe('Create transactions tests 2', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_6)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
  })

  it('Verify advance parameters are saved after editing', () => {
    happyPathToStepTwo()
    createtx.changeNonce('5')
    createtx.clickOnContinueSignTransactionBtn()
    createtx.selectComboButtonOption('execute')
    createtx.selectCurrentWallet()
    createtx.openExecutionParamsModal()
    createtx.setAdvncedExecutionParams()
    createtx.displayAdvncedDetails()
    createtx.verifyEditedExutionParams()
  }
  )

  it('Verify advance parameters gas limit input', () => {
    happyPathToStepTwo()
    createtx.changeNonce('5')
    createtx.clickOnContinueSignTransactionBtn()
    createtx.selectComboButtonOption('execute')
    createtx.selectCurrentWallet()
    createtx.openExecutionParamsModal()
    createtx.verifyAndSubmitExecutionParams()
  })

  it('Verify a transaction shows relayer attempts', () => {
    happyPathToStepTwo()
    createtx.verifySubmitBtnIsEnabled()
    createtx.verifyNativeTokenTransfer()
    createtx.changeNonce('5')
    createtx.clickOnContinueSignTransactionBtn()
    createtx.selectComboButtonOption('execute')
    createtx.verifyRelayerAttemptsAvailable()
  })
})
