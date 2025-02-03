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

describe('Limit order tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify limit order confirmation details', { defaultCommandTimeout: 60000 }, () => {
    const limitPrice = swaps.createRegex(swapOrder.DAIeqCOW, 'COW')
    const widgetFee = swaps.getWidgetFee()
    const orderID = swaps.getOrderID()

    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
    swaps.acceptLegalDisclaimer()
    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToLimit()
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(500)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.setLimitExpiry(swaps.limitOrderExpiryOptions.five_minutes)
      swaps.clickOnReviewOrderBtn()
      swaps.placeLimitOrder()
    })

    swaps.verifyOrderDetails(limitPrice, swapOrder.expiry5Mins, 'i', swapOrder.interactWith, orderID, widgetFee)
  })
})
