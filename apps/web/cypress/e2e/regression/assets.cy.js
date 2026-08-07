import * as constants from '../../support/constants'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as main from '../pages/main.page'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Assets tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Disconnected', () => {
    beforeEach(() => {
      cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    })

    it('Verify that "Hide token" button is present and opens the "Hide tokens menu"', () => {
      assets.toggleShowAllTokens(true)
      assets.toggleHideDust(false)
      assets.openHiddenTokensFromManageMenu()
      assets.verifyEachRowHasCheckbox()
    })

    it('Verify that Token list dropdown shows options "Default tokens" and "All tokens"', () => {
      let spamTokens = [
        assets.currencyAave,
        assets.currencyTestTokenA,
        assets.currencyTestTokenB,
        assets.currencyUSDC,
        assets.currencyLink,
        assets.currencyDaiCap,
      ]

      assets.toggleHideDust(false)

      // On chains without portfolio support (Sepolia), trusted filtering is disabled, so
      // "Default tokens" behaves like "All tokens". Asserting the two modes show different
      // lists requires a portfolio-supported chain (e.g. mainnet).
      // Mirrors the same assertions in smoke/assets.cy.js.
      assets.toggleShowAllTokens(false)
      main.verifyValuesExist(assets.tokenListTable, [constants.tokenNames.sepoliaEther, ...spamTokens])

      assets.toggleShowAllTokens(true)
      spamTokens.push(constants.tokenNames.sepoliaEther)
      main.verifyValuesExist(assets.tokenListTable, spamTokens)
    })
  })

  describe('Connected', () => {
    it('Verify that clicking the button with an owner opens the Send funds form', () => {
      wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
      assets.toggleShowAllTokens(true)
      assets.toggleHideDust(false)
      cy.wait(2000)
      assets.clickOnSendBtnAssetsTable(0)
    })
  })
})
