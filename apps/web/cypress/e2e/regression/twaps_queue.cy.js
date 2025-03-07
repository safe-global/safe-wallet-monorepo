import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

let staticSafes = []

const swapsHistory = swaps_data.type.history

describe('Twaps queue tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that Twap Tx create via CowSwap safe app has decoding in the queue', () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellTwapQLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')
    const sellAmount = swaps.getTokenPrice('COW')
    const buyAmount = swaps.getTokenPrice('DAI')
    const tokenSoldPrice = swaps.getTokenPrice('COW')

    create_tx.verifySummaryByName(swapsHistory.twaporder_title)
    main.verifyElementsExist([create_tx.altImgDai, create_tx.altImgCow], create_tx.altImgTwapOrder)

    create_tx.verifyExpandedDetails([swapsHistory.sell, dai, eq, swapsHistory.dai, swapsHistory.filled])
    swaps.checkNumberOfParts(2)
    swaps.checkSellAmount(sellAmount)
    swaps.checkBuyAmount(buyAmount)
    swaps.checkPercentageFilled(0, tokenSoldPrice)

    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.multiSend, swapsHistory.multiSendCallOnly1_4_1])
  })
})
