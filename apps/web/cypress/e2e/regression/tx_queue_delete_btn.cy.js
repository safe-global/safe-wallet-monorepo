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

const nextTxToBeExecuted =
  '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x539c9c2cd63bae1e4f84f71ef9aa7aea1fd8edb82b089c741cffad99843d0884'

const previousTx =
  '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0x9b4ee6ef9271fa2f2a4e97c3b5165dc7844a124accbf02cddaf91393ef2687da'

describe('Transaction queue Delete button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the option to Delete tx is available in the Reject tx modal for the next tx to be executed', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + nextTxToBeExecuted)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyDeleteChoiceBtnStatus(constants.enabledStates.enabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify the option of Delete tx is disabled for a tx that is not next to be executed', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + previousTx)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyDeleteChoiceBtnStatus(constants.enabledStates.disabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that only the owner that proposed the tx has the option to delete it', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + previousTx)
    wallet.connectSigner(signer)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    main.verifyElementsCount(create_tx.deleteChoiceBtn, 0)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
