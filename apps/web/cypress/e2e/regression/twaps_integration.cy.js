import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []
let iframeSelector
const swapOrder = swaps_data.type.orderDetails

describe('TWAP tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept('GET', constants.transactionHistoryEndpoint).as('History')
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
    cy.wait('@History', { timeout: 20000 })
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  // ========================================
  // UI/UX Tests
  // ========================================

  it('Verify list of tokens with balances is displayed in the token selector', () => {
    const tokens = [
      { name: swaps.swapTokenNames.eth, balance: '0' },
      { name: swaps.swapTokenNames.cow, balance: '749' },
      { name: swaps.swapTokenNames.daiTest, balance: '0' },
      { name: swaps.swapTokenNames.gnoTest, balance: '0' },
      { name: swaps.swapTokenNames.uni, balance: '0' },
      { name: swaps.swapTokenNames.usdcTest, balance: '0' },
      { name: swaps.swapTokenNames.usdt, balance: '0' },
      { name: swaps.swapTokenNames.weth, balance: '0' },
    ]

    swaps.acceptLegalDisclaimer()
    cy.wait(4000)

    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToTwap()
    })
    swaps.unlockTwapOrders(iframeSelector)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.clickOnTokenSelctor('input')
      swaps.checkTokenList(tokens)
    })
  })

  it('Verify "Balances" tag and value is present for selected token', () => {
    const tokenValue = swaps.getTokenValue()

    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToTwap()
    })
    swaps.unlockTwapOrders(iframeSelector)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(500)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.checkTokenBalanceAndValue('input', '749 COW', tokenValue)
    })
  })

  it('Verify that the "Max" button sets the value as the max balance', () => {
    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToTwap()
    })
    swaps.unlockTwapOrders(iframeSelector)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.clickOnMaxBtn()
      swaps.checkInputValue('input', '749')
    })
  })

  // ========================================
  // Validation Tests
  // ========================================

  it('Verify "Insufficient balance" message appears when the entered token amount exceeds "Max" balance', () => {
    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToTwap()
    })
    swaps.unlockTwapOrders(iframeSelector)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(2000)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.checkInsufficientBalanceMessageDisplayed(swaps.swapTokens.cow)
    })
  })

  it('Verify "Sell amount too low" if the amount of tokens is worth less than 200 USD', () => {
    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.switchToTwap()
    })
    swaps.unlockTwapOrders(iframeSelector)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(10)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.checkSmallSellAmountMessageDisplayed()
    })
  })

  it(
    'Verify entering a blocked address in the custom recipient input blocks the form',
    { defaultCommandTimeout: 60000 },
    () => {
      let isCustomRecipientFound
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main
        .getIframeBody(iframeSelector)
        .then(($frame) => {
          isCustomRecipientFound = (customRecipient) => {
            const element = $frame.find(customRecipient)
            return element.length > 0
          }
        })
        .within(() => {
          swaps.switchToTwap()
        })
      swaps.unlockTwapOrders(iframeSelector)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.clickOnSettingsBtnTwaps()
        swaps.enableTwapCustomRecipient(isCustomRecipientFound(swaps.customRecipient))
        swaps.clickOnSettingsBtnTwaps()
        swaps.enterRecipient(swaps.blockedAddress)
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
      })
      cy.contains(swaps.blockedAddressStr)
    },
  )

  // ========================================
  // Order Creation Tests
  // ========================================

  it('Verify order details', { defaultCommandTimeout: 60000 }, () => {
    const limitPrice = swaps.createRegex(swapOrder.DAIeqCOW, 'COW')
    const widgetFee = swaps.getWidgetFee()
    const slippage = swaps.getWidgetFee()

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
})
