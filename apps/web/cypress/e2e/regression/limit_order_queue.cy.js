import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

let staticSafes = []

const swapsHistory = swaps_data.type.history

describe('Limit order queue tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that limit order tx created via CowSwap safe app has decoding in the history', { defaultCommandTimeout: 30000 }, () => {
    cy.visit(constants.transactionUrl + staticSafes.SEP_STATIC_SAFE_34 + swaps.swapTxs.sellQLimitOrder)
    const dai = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqCOW, 'COW')

    create_tx.verifySummaryByName(
      swapsHistory.limitorder_title
    )
    main.verifyElementsExist([create_tx.altImgCow, create_tx.altImgDai], create_tx.altImgLimitOrder)
    create_tx.verifyExpandedDetails([swapsHistory.sellOrder, swapsHistory.sell, dai, eq, swapsHistory.executionNeeded])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([swapsHistory.gGpV2, swapsHistory.actionPreSignatureG])
  })
})
