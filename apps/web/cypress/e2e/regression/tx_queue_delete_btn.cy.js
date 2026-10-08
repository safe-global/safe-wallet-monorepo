import deletionTransactions from '../../fixtures/deletion-transactions.js'
import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_3_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Transaction queue Delete button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the option to Delete tx is available in the Reject tx modal for the next tx to be executed', () => {
    wallet.connectSignerViaStorage(
      signer2,
      constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + deletionTransactions.nextTxToBeExecuted,
    )
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyDeleteChoiceBtnStatus(constants.enabledStates.enabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify the option of Delete tx is disabled for a tx that is not next to be executed', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + deletionTransactions.previousTx)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyDeleteChoiceBtnStatus(constants.enabledStates.disabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that only the owner that proposed the tx has the option to delete it', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + deletionTransactions.previousTx)
    wallet.connectSigner(signer)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    main.verifyElementsCount(create_tx.deleteChoiceBtn, 0)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
