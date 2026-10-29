import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import swapFixtures from '../../fixtures/swaps.js'

const swapsHistory = swaps_data.type.history

describe('Swaps history tests', () => {
  it('Verify "Partially filled" field is displayed in limit order', () => {
    cy.visit(constants.transactionUrl + swapFixtures.limitOrderSafe + swapFixtures.partiallyFilledLimitOrder)
    create_tx.verifyExpandedDetails([swapsHistory.partiallyFilled])
  })
})
