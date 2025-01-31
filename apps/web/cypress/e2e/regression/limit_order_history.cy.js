import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []

let iframeSelector

const swapsHistory = swaps_data.type.history
const swapOrder = swaps_data.type.orderDetails

describe('Limit order history tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify "Expired" field in the tx details for limit orders', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_1 + swaps.swapTxs.sellLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')

    create_tx.verifyExpandedDetails([swapsHistory.sellOrder, swapsHistory.sell, dai, eq, swapsHistory.expired])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.gGpV2, swapsHistory.actionPreSignatureG])
  })

  it('Verify "Filled" field in the tx details for limit orders', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + swaps.limitOrderSafe + swaps.swapTxs.sellLimitOrderFilled)
    const usdc = swaps.createRegex(swapsHistory.forAtLeastFullUSDT, 'USDT')
    const eq = swaps.createRegex(swapsHistory.USDTeqUSDC, 'USDC')

    create_tx.verifyExpandedDetails([swapsHistory.sellOrder, swapsHistory.sell, usdc, eq, swapsHistory.filled])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.gGpV2, swapsHistory.actionPreSignatureG])
  })
})
