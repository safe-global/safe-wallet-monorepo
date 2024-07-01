import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import * as tx from '../pages/transactions.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as owner from '../pages/owners.pages'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
let staticSafes = []

let iframeSelector

describe('Swaps tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_1)
    wallet.connectSigner(signer)
    main.acceptCookies()
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  // TODO: Waiting for signer connection issue be resolved
  it.skip('Verify an order can be created, signed and appear in tx queue', { defaultCommandTimeout: 30000 }, () => {
    swaps.acceptLegalDisclaimer()
    swaps.waitForOrdersCallToComplete()
    cy.wait(2000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.clickOnSettingsBtn()
      swaps.setSlippage('0.30')
      swaps.setExpiry('2')
      swaps.clickOnSettingsBtn()
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.checkTokenBalance(staticSafes.SEP_STATIC_SAFE_1.substring(4), swaps.swapTokens.cow)
      swaps.setInputValue(4)
      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.checkSwapBtnIsVisible()
      swaps.isInputGreaterZero(swaps.outputurrencyInput).then((isGreaterThanZero) => {
        cy.wrap(isGreaterThanZero).should('be.true')
      })
      swaps.clickOnExceeFeeChkbox()
      swaps.clickOnSwapBtn()
      swaps.clickOnSwapBtn()
    })
    create_tx.changeNonce(12)
    tx.selectExecuteLater()
    cy.wait(1000)

    create_tx.clickOnSignTransactionBtn()
    main.getIframeBody(iframeSelector).within(() => {
      swaps.verifyOrderSubmittedConfirmation()
    })
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_1)
    main.verifyElementsCount(create_tx.transactionItem, 1)
    create_tx.verifySummaryByName(swapsQueue.contractName, [swapsQueue.action, swapsQueue.oneOfOne])
    cy.visit(constants.transactionQueueUrl + staticSafes.SEP_STATIC_SAFE_1)
    owner.waitForConnectionStatus()
    main.acceptCookies()
    // main.connectSigner(signer)
    create_tx.clickOnTransactionItem(0)
    create_tx.deleteTx()
    main.verifyElementsCount(create_tx.transactionItem, 0)
  })

  it(
    'Verify entering a blocked address in the custom recipient input blocks the form',
    { defaultCommandTimeout: 60000 },
    () => {
      let isCustomRecipientFound
      swaps.acceptLegalDisclaimer()
      swaps.waitForOrdersCallToComplete()
      cy.wait(2000)
      main
        .getIframeBody(iframeSelector)
        .then(($frame) => {
          isCustomRecipientFound = (customRecipient) => {
            const element = $frame.find(customRecipient)
            return element.length > 0
          }
        })
        .within(() => {
          swaps.clickOnSettingsBtn()
          swaps.enableCustomRecipient(isCustomRecipientFound(swaps.customRecipient))
          swaps.clickOnSettingsBtn()
          swaps.enterRecipient(swaps.blockedAddress)
        })
      cy.contains(swaps.blockedAddressStr)
    },
  )

  it('Verify enabling custom recipient adds that field to the form', { defaultCommandTimeout: 60000 }, () => {
    swaps.acceptLegalDisclaimer()
    swaps.waitForOrdersCallToComplete()
    cy.wait(2000)

    const isCustomRecipientFound = ($frame, customRecipient) => {
      const element = $frame.find(customRecipient)
      return element.length > 0
    }

    main.getIframeBody(iframeSelector).then(($frame) => {
      cy.wrap($frame).within(() => {
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
        swaps.enterRecipient('1')
      })
    })
  })
})
