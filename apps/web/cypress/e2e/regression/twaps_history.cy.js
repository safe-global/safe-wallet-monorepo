import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as data from '../../fixtures/txhistory_data_data.json'
import swapFixtures from '../../fixtures/swaps.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []

let iframeSelector

const swapsHistory = swaps_data.type.history
const swapOrder = swaps_data.type.orderDetails
const typeGeneral = data.type.general

describe('Twaps history tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify partially filled sell order', () => {
    const tx = swapFixtures.twapPartiallyFilled
    cy.visit(constants.transactionUrl + tx)
    const weth = swaps.createRegex(swapsHistory.forAtLeastFullWETH, 'WETH')
    const eq = swaps.createRegex(swapsHistory.WETHeqDAI, 'DAI')
    const sellAmount = swaps.getTokenPrice('DAI')
    const buyAmount = swaps.getTokenPrice('WETH')
    const tokenSoldPrice = swaps.getTokenPrice('DAI')

    create_tx.verifyExpandedDetails([swapsHistory.sell, weth, eq, swapsHistory.dai, swapsHistory.partiallyFilled])
    swaps.checkNumberOfParts(2)
    swaps.checkSellAmount(sellAmount)
    swaps.checkBuyAmount(buyAmount)
    swaps.checkPercentageFilled(50, tokenSoldPrice)
    swaps.checkPartDuration('30 minutes')

    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.createWithContext, swapsHistory.composableCoW])
  })

  it('Verify that an order has the received and sent txs', () => {
    const sentValue = '-250 COW'
    const receivedValue = '303.16951 DAI'

    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_27)
    create_tx.toggleUntrustedTxs()
    swaps.checkTwapSettlement(0, sentValue, receivedValue)
  })

  it('Verify fully filled sell order', () => {
    const tx = swapFixtures.twapFilled
    cy.visit(constants.transactionUrl + tx)
    const weth = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqWETH, 'WETH')
    const sellAmount = swaps.getTokenPrice('WETH')
    const buyAmount = swaps.getTokenPrice('DAI')
    const tokenSoldPrice = swaps.getTokenPrice('WETH')

    create_tx.verifySummaryByName(swapsHistory.twaporder_title, [typeGeneral.statusOk])
    main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgWeth], create_tx.altImgTwapOrder)
    create_tx.verifyExpandedDetails([swapsHistory.sell, weth, eq, swapsHistory.dai, swapsHistory.filled])
    swaps.checkNumberOfParts(2)
    swaps.checkSellAmount(sellAmount)
    swaps.checkBuyAmount(buyAmount)
    swaps.checkPercentageFilled(100, tokenSoldPrice)
    swaps.checkPartDuration('30 minutes')

    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.createWithContext, swapsHistory.composableCoW])
  })
})
