import * as constants from '../../support/constants'
import * as main from '../../e2e/pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

let staticSafes = []

describe('[SMOKE] Assets tests', () => {
  const fiatRegex = assets.fiatRegex

  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[SMOKE] Verify that the native token is visible', () => {
    assets.verifyTokenIsPresent(constants.tokenNames.sepoliaEther)
  })

  it('[SMOKE] Verify that the token tab is selected by default and the table is visible', () => {
    assets.verifyTokensTabIsSelected('true')
  })

  it('[SMOKE] Verify token list filter and dust filter functionality', () => {
    let spamTokens = [
      assets.currencyAave,
      assets.currencyTestTokenA,
      assets.currencyTestTokenB,
      assets.currencyUSDC,
      assets.currencyLink,
      assets.currencyDaiCap,
    ]

    // Disable dust filter to see tokens with no fiat value
    assets.toggleHideDust(false)

    // Verify default tokens list shows only native token
    assets.toggleShowAllTokens(false)
    main.verifyValuesExist(assets.tokenListTable, [constants.tokenNames.sepoliaEther])
    main.verifyValuesDoNotExist(assets.tokenListTable, spamTokens)

    // Verify all tokens list shows spam tokens
    assets.toggleShowAllTokens(true)
    spamTokens.push(constants.tokenNames.sepoliaEther)
    main.verifyValuesExist(assets.tokenListTable, spamTokens)

    // Verify dust filter hides tokens with no value
    assets.toggleHideDust(true)
    main.verifyValuesExist(assets.tokenListTable, [constants.tokenNames.sepoliaEther])
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyAave])
  })
})
