import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import { spendingLimitTxOption } from '../pages/spending_limits.pages'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer2 = walletCredentials.OWNER_4_PRIVATE_KEY

const sendQueueTx =
  '&id=multisig_0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb_0xcfbe040521dd80d43f408c7fd3ce7d80f21e8916a04a56ff0fe5cd14eb1a508f'

describe('Transaction queue Replace button tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify "Reject tx" modal has the Replace tx option', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.verifyReplaceChoiceBtnVisible()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify Replace tx takes to a "Send funds" form with the same nonce as the tx being replaced', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnReplaceTxOption()
    create_tx.verifyNonceInputValue('0')
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify there is no "Add to batch" option in a Send funds screen via replace tx', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnReplaceTxOption()
    main.verifyElementsCount(create_tx.addToBatchBtn, 0)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify there is no spending limit option in Send funds form when replacing a tx', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_7 + sendQueueTx)
    wallet.connectSigner(signer2)
    create_tx.clickOnRejectBtn()
    create_tx.verifyTxRejectModalVisible()
    create_tx.clickOnReplaceTxOption()
    main.verifyElementsCount(spendingLimitTxOption, 0)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
