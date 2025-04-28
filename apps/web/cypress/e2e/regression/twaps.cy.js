import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as swaps from '../pages/swaps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

let staticSafes = []
let iframeSelector

describe('Twaps tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_27)
    wallet.connectSigner(signer)
    iframeSelector = `iframe[src*="${constants.swapWidget}"]`
  })

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
})
