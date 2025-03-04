import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []
let iframeSelector

describe('Twaps 2 tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  it(
    'Verify "Insufficient balance" message appears when the entered token amount exceeds "Max" balance',
    { defaultCommandTimeout: 30000 },
    () => {
      wallet.connectSigner(signer)
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
    },
  )

  it(
    'Verify "Sell amount too low" if the amount of tokens is worth less than 200 USD',
    { defaultCommandTimeout: 30000 },
    () => {
      wallet.connectSigner(signer)
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.switchToTwap()
      })
      swaps.unlockTwapOrders(iframeSelector)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.setInputValue(100)
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
        swaps.checkSmallSellAmountMessageDisplayed()
      })
    },
  )

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
      })
      cy.contains(swaps.blockedAddressStr)
    },
  )
})
