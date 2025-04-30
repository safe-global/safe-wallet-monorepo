import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as owner from '../pages/owners.pages'
import * as wallet from '../../support/utils/wallet.js'
import * as swaps_data from '../../fixtures/swaps_data.json'
import * as navigation from '../pages/navigation.page'
import { getEvents, events, checkDataLayerEvents } from '../../support/utils/gtag.js'
import { getMockAddress } from '../../support/utils/ethers.js'
import { add } from 'lodash'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_WALLET_ADDRESS
const signer3 = walletCredentials.OWNER_1_PRIVATE_KEY

let staticSafes = []

let iframeSelector

const swapOrder = swaps_data.type.orderDetails

describe('Swaps tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_1)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  it(
    'Verify entering a blocked address in the custom recipient input blocks the form',
    { defaultCommandTimeout: 30000 },
    () => {
      let isCustomRecipientFound
      swaps.getMockQuoteResponse(swaps.quoteResponse.quote1)
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
          swaps.selectInputCurrency(swaps.swapTokens.cow)
          swaps.clickOnSettingsBtn()
          swaps.enableCustomRecipient(isCustomRecipientFound(swaps.customRecipient))
          swaps.clickOnSettingsBtn()
          swaps.enterRecipient(swaps.blockedAddress)
          swaps.selectOutputCurrency(swaps.swapTokens.dai)
          cy.wait('@mockedQuote').then((interception) => {
            expect(interception.response.statusCode).to.eq(200)
            cy.log('Intercepted response:', JSON.stringify(interception.response.body))
          })
        })
      cy.contains(swaps.blockedAddressStr)
    },
  )

  it('Verify enabling custom recipient adds that field to the form', { defaultCommandTimeout: 30000 }, () => {
    const address = getMockAddress()
    const address_ = '0x1234...5678'

    swaps.getMockQuoteResponse(swaps.quoteResponse.quote1)
    swaps.acceptLegalDisclaimer()

    cy.wait(4000)

    const isCustomRecipientFound = ($frame, customRecipient) => {
      const element = $frame.find(customRecipient)
      return element.length > 0
    }

    main.getIframeBody(iframeSelector).then(($frame) => {
      cy.wrap($frame).within(() => {
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.clickOnSettingsBtn()

        if (isCustomRecipientFound($frame, swaps.customRecipient)) {
          swaps.disableCustomRecipient(true)
          cy.wait(1000)
          swaps.enableCustomRecipient(!isCustomRecipientFound($frame, swaps.customRecipient))
        } else {
          swaps.enableCustomRecipient(isCustomRecipientFound($frame, swaps.customRecipient))
          cy.wait(1000)
        }

        swaps.clickOnSettingsBtn()
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
        cy.wait('@mockedQuote').then((interception) => {
          expect(interception.response.statusCode).to.eq(200)
          cy.log('Intercepted response:', JSON.stringify(interception.response.body))
        })
        swaps.enterRecipient(address)
        swaps.checkSwapBtnIsVisible()
        swaps.isInputGreaterZero(swaps.outputCurrencyInput).then((isGreaterThanZero) => {
          cy.wrap(isGreaterThanZero).should('be.true')
        })
        swaps.clickOnExceeFeeChkbox()
        swaps.clickOnSwapBtn()
        swaps.clickOnSwapBtn()
        swaps.confirmPriceImpact()
      })
      cy.contains(address_)
    })
  })

  it('Verify order details are displayed in swap confirmation', { defaultCommandTimeout: 30000 }, () => {
    const limitPrice = swaps.createRegex(swapOrder.DAIeqCOW, 'COW')
    const widgetFee = swaps.getWidgetFee()
    const orderID = swaps.getOrderID()
    const slippage = swaps.getWidgetFee()

    swaps.getMockQuoteResponse(swaps.quoteResponse.quote1)
    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(200)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)

      cy.wait('@mockedQuote').then((interception) => {
        expect(interception.response.statusCode).to.eq(200)
        cy.log('Intercepted response:', JSON.stringify(interception.response.body))
      })

      swaps.checkSwapBtnIsVisible()
      swaps.isInputGreaterZero(swaps.outputCurrencyInput).then((isGreaterThanZero) => {
        cy.wrap(isGreaterThanZero).should('be.true')
      })
      swaps.clickOnExceeFeeChkbox()
      swaps.clickOnSwapBtn()
      swaps.clickOnSwapBtn()
      swaps.confirmPriceImpact()
    })

    swaps.verifyOrderDetails(limitPrice, slippage, swapOrder.interactWith, orderID, widgetFee)
  })

  it(
    'Verify recipient address alert is displayed in order details if the recipient is not owner of the order',
    { defaultCommandTimeout: 30000 },
    () => {
      const limitPrice = swaps.createRegex(swapOrder.DAIeqCOW, 'COW')
      const widgetFee = swaps.getWidgetFee()
      const orderID = swaps.getOrderID()

      const isCustomRecipientFound = ($frame, customRecipient) => {
        const element = $frame.find(customRecipient)
        return element.length > 0
      }
      swaps.getMockQuoteResponse(swaps.quoteResponse.quote1)
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main.getIframeBody(iframeSelector).then(($frame) => {
        cy.wrap($frame).within(() => {
          swaps.selectInputCurrency(swaps.swapTokens.cow)
          swaps.setInputValue(1000)
          swaps.selectOutputCurrency(swaps.swapTokens.dai)
          cy.wait('@mockedQuote').then((interception) => {
            expect(interception.response.statusCode).to.eq(200)
            cy.log('Intercepted response:', JSON.stringify(interception.response.body))
          })
          swaps.checkSwapBtnIsVisible()
          swaps.clickOnSettingsBtn()

          if (isCustomRecipientFound($frame, swaps.customRecipient)) {
            swaps.disableCustomRecipient(true)
            cy.wait(1000)
            swaps.enableCustomRecipient(!isCustomRecipientFound($frame, swaps.customRecipient))
          } else {
            swaps.enableCustomRecipient(isCustomRecipientFound($frame, swaps.customRecipient))
            cy.wait(1000)
          }

          swaps.clickOnSettingsBtn()
          swaps.enterRecipient(signer2)
          swaps.clickOnExceeFeeChkbox()
          swaps.clickOnSwapBtn()
          swaps.verifyRecipientAlertIsDisplayed()
        })
      })
    },
  )
})
