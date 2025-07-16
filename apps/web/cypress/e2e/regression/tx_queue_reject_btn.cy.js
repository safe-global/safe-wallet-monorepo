import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as data from '../../fixtures/txhistory_data_data.json'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page'
import { disconnectedUserErrorMsg } from '../pages/owners.pages'
import { comboButtonOptions } from '../pages/create_tx.pages'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_3_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_4_PRIVATE_KEY

const typeOnchainRejection = data.type.onchainRejection

const onchainRejectionTx =
  '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x13037f442aa430867c6f50799382fe42ae788896e2d032a6849bf07bc87d0fe2'

const onchainRejectionTx2 =
  '&id=multisig_0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe_0x66460c1f56c55fc2101565cb968a0cf393be0fe84528d7507a81be7125160034'

describe('Transaction queue Reject button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify a tx in queue shows the Reject button', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    create_tx.getRejectButton().should('be.visible')
  })

  it('Verify that Reject button is disabled out for non-owners and disconnected users', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    create_tx.verifyRejectBtnDisabled()
    wallet.connectSigner(signer)
    create_tx.verifyRejectBtnDisabled()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that clicking a disabled Reject button when not connected opens the Onboard modal', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    create_tx.hoverOverRejectBtnBtn()
    main.verifyTextVisibility([disconnectedUserErrorMsg])
  })

  it('Verify that clicking rejection with an owner opens a modal with the Reject option', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that using the Reject option opens a tx modal showing the nonce that will be rejected', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnRejectionChoiceBtn(1)
    create_tx.verifyTxNonceDisplayed(0)
    create_tx.checkNonceIsReadOnly()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify a Reject tx name is "On-Chain rejection" in history', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + onchainRejectionTx)
    create_tx.verifyTxHeaderDetails([typeOnchainRejection.title])
  })

  it('Verify a Reject tx cannot be "Added as batch"', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnRejectionChoiceBtn(1)
    create_tx.clickOnContinueSignTransactionBtn()
    create_tx.checkThatComboButtonOptionIsNotPresent(create_tx.comboButtonOptions.addToBatch)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify 2 Reject tx cannot be created with the same nonce', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_37 + onchainRejectionTx2)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyRejecChoiceBtnStatus(constants.enabledStates.disabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
