import * as constants from '../../support/constants.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as txs from '../pages/transactions.page.js'
import fallbackHandlers from '../../fixtures/fallback-handlers.js'

let staticSafes = []

describe('Transaction details queue tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that when the tx contains action with unofficial fallbackhandler the warning is displayed', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_35 + txs.fallbackhandlerTx.illegalContract)
    txs.verifyUntrustedHandllerWarningVisible()
  })

  it('Verify that no error for the COWSwap fallbackhandler on tx details screen', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellTwapQLimitOrder)
    create_tx.clickOnExpandAllActionsBtn()
    create_tx.verifyExpandedDetails([create_tx.txActions.setFallbackHandler])
    txs.verifyUntrustedHandllerWarningDoesNotExist()
  })

  it('Verify that when the tx contains the action with an official 1.4.1 fallbackhandler contract there is no error', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_35 + fallbackHandlers.official141)
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyExpandedDetails([create_tx.txActions.setFallbackHandler])
    txs.verifyUntrustedHandllerWarningDoesNotExist()
  })
})
