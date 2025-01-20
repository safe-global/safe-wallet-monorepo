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

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('Verify that "Hide token" button is present and opens the "Hide tokens menu"', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.verifyEachRowHasCheckbox()
  })

  it('Verify that clicking the button with an owner opens the Send funds form', () => {
    wallet.connectSigner(signer)
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.clickOnSendBtn(0)
  })

  it('[SMOKE] Verify that Token list dropdown down options show/hide spam tokens', () => {
    let spamTokens = [
      assets.currencyAave,
      assets.currencyTestTokenA,
      assets.currencyTestTokenB,
      assets.currencyUSDC,
      assets.currencyLink,
      assets.currencyDaiCap,
    ]

    main.verifyValuesDoNotExist(assets.tokenListTable, spamTokens)
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    spamTokens.push(constants.tokenNames.sepoliaEther)
    main.verifyValuesExist(assets.tokenListTable, spamTokens)
  })
})
