import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as data from '../../fixtures/txhistory_data_data.json'

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

  it('Verify order details', { defaultCommandTimeout: 60000 }, () => {
    const limitPrice = swaps.createRegex(swapOrder.DAIeqCOW, 'COW')
    const widgetFee = swaps.getWidgetFee()
    const slippage = swaps.getWidgetFee()

    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
    swaps.acceptLegalDisclaimer()
    main.getIframeBody(iframeSelector).within(() => {
      cy.wait(20000) // Need more time to load UI
      swaps.switchToTwap()
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(500)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.outputInputIsNotEmpty()
      swaps.confirmPriceImpact()
      swaps.verifyReviewOrderBtnIsVisible()
      swaps.getTwapInitialData().then((formData) => {
        cy.wrap(formData).as('twapFormData')
        cy.wait(5000)
        swaps.clickOnReviewOrderBtn()
        swaps.placeTwapOrder()
        swaps.confirmPriceImpact()
      })
    })

    cy.get('@twapFormData').then((formData) => {
      swaps.checkTwapValuesInReviewScreen(formData)
      cy.get('[data-testid="slippage"] [data-testid="tx-data-row"]').invoke('text').should('match', slippage)
      cy.get('[data-testid="widget-fee"] [data-testid="tx-data-row"]').invoke('text').should('match', widgetFee)
      cy.get('[data-testid="limit-price"] [data-testid="tx-data-row"]').invoke('text').should('match', limitPrice)
    })
  })

  it('Verify partially filled sell order', () => {
    const tx =
      'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0x2fdf5e5d94306de5f7285fd74ca014067b090338b3ff15e3f66d6c02ef81e4a4'
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
    const tx =
      'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0xc8a9399afbba45e82a0645770db38386cbe10bec77dd8b6395f7d24e19a45c9a'
    cy.visit(constants.transactionUrl + tx)
    const weth = swaps.createRegex(swapsHistory.forAtLeastFullDai, 'DAI')
    const eq = swaps.createRegex(swapsHistory.DAIeqWETH, 'WETH')
    const sellAmount = swaps.getTokenPrice('WETH')
    const buyAmount = swaps.getTokenPrice('DAI')
    const tokenSoldPrice = swaps.getTokenPrice('WETH')

    create_tx.verifySummaryByName(swapsHistory.twaporder_title, null, [typeGeneral.statusOk])
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
