import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []
let iframeSelector

describe('Swaps 2 tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_1)
    main.waitForHistoryCallToComplete()
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

  it('Verify Setting the top token first in a swap creates a "Sell order" tx', { defaultCommandTimeout: 30000 }, () => {
    const value = '200 COW'
    swaps.acceptLegalDisclaimer()
    cy.wait(4000)
    main.getIframeBody(iframeSelector).within(() => {
      swaps.selectInputCurrency(swaps.swapTokens.cow)
      swaps.setInputValue(200)

      swaps.selectOutputCurrency(swaps.swapTokens.dai)
      swaps.checkSwapBtnIsVisible()
      swaps.isInputGreaterZero(swaps.outputCurrencyInput).then((isGreaterThanZero) => {
        cy.wrap(isGreaterThanZero).should('be.true')
      })
      swaps.clickOnExceeFeeChkbox()
      swaps.clickOnSwapBtn()
      swaps.checkInputCurrencyPreviewValue(value)
      swaps.clickOnSwapBtn()
    })
    swaps.checkTokenBlockValue(0, value)
  })

  it(
    'Verify Setting the bottom token first in a swap creates a "Buy order" tx',
    { defaultCommandTimeout: 30000 },
    () => {
      const value = swaps.getTokenValue()
      const tokenValue = '600'
      swaps.acceptLegalDisclaimer()
      cy.wait(4000)
      main.getIframeBody(iframeSelector).within(() => {
        swaps.selectOutputCurrency(swaps.swapTokens.dai)
        swaps.setOutputValue(tokenValue)
        swaps.selectInputCurrency(swaps.swapTokens.cow)
        swaps.checkSwapBtnIsVisible()
        swaps.isInputGreaterZero(swaps.outputCurrencyInput).then((isGreaterThanZero) => {
          cy.wrap(isGreaterThanZero).should('be.true')
        })

        swaps.clickOnSwapBtn()
        swaps.checkOutputCurrencyPreviewValue(value)
        swaps.clickOnSwapBtn()
        swaps.confirmPriceImpact()
      })
      swaps.checkTokenBlockValue(1, tokenValue)
    },
  )
})
