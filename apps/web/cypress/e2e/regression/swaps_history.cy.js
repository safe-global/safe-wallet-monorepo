import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import swapFixtures from '../../fixtures/swaps.js'

let staticSafes = []

const swapsHistory = swaps_data.type.history

describe('Swaps history tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.transactionsHistoryUrl + staticSafes.SEP_STATIC_SAFE_1)
  })

  it('Verify swap selling operation with one action', { defaultCommandTimeout: 30000 }, () => {
    create_tx.clickOnTransactionItemByName('14')
    create_tx.verifyExpandedDetails([
      swapsHistory.sellOrder,
      swapsHistory.sell,
      swapsHistory.oneCOW,
      swapsHistory.forAtLeast,
      swapsHistory.dai,
      swapsHistory.filled,
    ])
  })

  it('Verify "Partially filled" field is displayed in limit order', () => {
    cy.visit(constants.transactionUrl + swapFixtures.limitOrderSafe + swapFixtures.partiallyFilledLimitOrder)
    create_tx.verifyExpandedDetails([swapsHistory.partiallyFilled])
  })
})
