import * as constants from '../../support/constants.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as txs from '../pages/transactions.page.js'

let staticSafes = []

const txUrls = {
  '1_4_1': '&id=multisig_0xc36A530ccD728d36a654ccedEB7994473474C018_0x2b68245cc89c3e2c602f8c426d987ec535f2cd7362d5cac20deb9703dc714a0e',
}

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
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_35 + txUrls['1_4_1'])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyExpandedDetails([create_tx.txActions.setFallbackHandler])
    txs.verifyUntrustedHandllerWarningDoesNotExist()
  })
})
