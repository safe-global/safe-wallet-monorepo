import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

let staticSafes = []

const swapsHistory = swaps_data.type.history
const swapsQueue = swaps_data.type.queue
const orderDetails = swaps_data.type.orderDetails

describe('Transaction queue tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify sell Limit order in queue', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')

    create_tx.verifyTxHeaderDetails([swapsQueue.oneOfTwo, swapsHistory.limitorder_title])
    create_tx.verifyExpandedDetails([
      swapsHistory.filled,
      swapsHistory.status,
      swapsHistory.oderId,
      swapsHistory.limitPrice,
      swapsHistory.sellOrder,
      swapsHistory.sell,
      dai,
      eq,
      swapsHistory.executionNeeded,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyExpandedDetails(
      [swapsHistory.multiSend, swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_4_1],
      create_tx.delegateCallWarning,
    )
    main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow])
  })

  it('Verify sell Swap order in queue', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellSwapQLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')

    create_tx.verifyTxHeaderDetails([swapsQueue.oneOfTwo, swapsHistory.title])
    create_tx.verifyExpandedDetails([
      swapsHistory.status,
      swapsHistory.oderId,
      swapsHistory.limitPrice,
      swapsHistory.sellOrder,
      swapsHistory.sell,
      swapsHistory.expired,

      dai,
      eq,
    ])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyExpandedDetails(
      [swapsHistory.multiSend, swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_4_1],
      create_tx.delegateCallWarning,
    )
    main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow])
  })

  it('Verify sell TWAP order in queue', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellTwapQLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
    const sellAmount = swaps.getTokenPrice('COW')
    const buyAmount = swaps.getTokenPrice('DAI')
    const tokenSoldPrice = swaps.getTokenPrice('COW')

    create_tx.verifyTxHeaderDetails([swapsQueue.oneOfTwo, swapsHistory.twaporder_title])
    create_tx.verifyExpandedDetails([
      swapsHistory.filled,
      swapsHistory.limitPrice,
      swapsHistory.sellOrder,
      swapsHistory.sell,
      swapsHistory.executionNeeded,
      orderDetails.expiry12Months,
      dai,
      eq,
    ])
    swaps.checkNumberOfParts(2)
    swaps.checkSellAmount(sellAmount)
    swaps.checkBuyAmount(buyAmount)
    swaps.checkPercentageFilled(0, tokenSoldPrice)
    swaps.checkPartDuration('182 days')
    main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow])
  })
})
