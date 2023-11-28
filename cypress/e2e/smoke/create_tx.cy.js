import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as createtx from '../../e2e/pages/create_tx.pages'

const sendValue = 0.00002
const currentNonce = 0

describe('[SMOKE] Create transactions tests', () => {
  before(() => {
    cy.clearLocalStorage()
    cy.visit(constants.BALANCE_URL + constants.SEPOLIA_TEST_SAFE_7)
    main.acceptCookies()
  })

  // TODO: Change title to: Verify a new send token transaction can be initiated
  it('[SMOKE] Verify a new send token transaction can be created', () => {
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    createtx.typeRecipientAddress(constants.EOA)
    createtx.clickOnTokenselectorAndSelectSepoliaEth()
    createtx.setMaxAmount()
    createtx.verifyMaxAmount(constants.tokenNames.sepoliaEther, constants.tokenAbbreviation.sep)
    createtx.setSendValue(sendValue)
    createtx.clickOnNextBtn()
  })

  it.skip('[SMOKE] Verify a transaction can be reviewed, edited and submitted', () => {
    createtx.verifySubmitBtnIsEnabled()
    cy.wait(1000)
    createtx.verifyNativeTokenTransfer()
    createtx.changeNonce(currentNonce)
    createtx.verifyConfirmTransactionData()
    createtx.openExecutionParamsModal()
    createtx.verifyAndSubmitExecutionParams()
    createtx.clickOnNoLaterOption()
    createtx.changeNonce(14)
    createtx.clickOnSignTransactionBtn()
  })

  it.skip('[SMOKE] Verify that clicking on notification shows the transaction in queue', () => {
    createtx.waitForProposeRequest()
    createtx.clickViewTransaction()
    createtx.verifySingleTxPage()
    createtx.verifyQueueLabel()
    createtx.verifyTransactionSummary(sendValue)
  })
})
