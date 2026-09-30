import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
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
    cy.intercept('GET', constants.transactionHistoryEndpoint).as('History')
    wallet.connectSignerViaStorage(signer, constants.swapUrl + staticSafes.SEP_STATIC_SAFE_1)
    cy.wait('@History', { timeout: 20000 })
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  it(
    'Verify entering a blocked address in the custom recipient input blocks the form',
    { defaultCommandTimeout: 30000 },
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
          swaps.selectInputCurrency(swaps.swapTokens.cow)
          swaps.clickOnSettingsBtn()
          swaps.enableCustomRecipient(isCustomRecipientFound(swaps.customRecipient))
          swaps.clickOnSettingsBtn()
          swaps.enterRecipient(swaps.blockedAddress)
        })

      swaps.verifyBlockedAddressFormShown()
    },
  )
})
