import { test, expect } from '../../fixtures/base.fixture'
import { AssetsPage } from '../../pages/assets.page'
import { staticSafes } from '../../data/safes'
import * as constants from '../../data/constants'

test.describe('[SMOKE] Assets tests', () => {
  let assets: AssetsPage

  test.beforeEach(async ({ safePage }) => {
    assets = new AssetsPage(safePage)
    await assets.goto(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  test('Verify that the native token is visible', async () => {
    await assets.verifyTokenIsPresent(constants.tokenNames.sepoliaEther)
  })

  test('Verify that the token tab is selected by default and the table is visible', async () => {
    await assets.verifyTokensTabIsSelected('true')
  })

  test('Verify token list filter and dust filter functionality', async () => {
    const spamTokens = [
      AssetsPage.currencyAave,
      AssetsPage.currencyTestTokenA,
      AssetsPage.currencyTestTokenB,
      AssetsPage.currencyUSDC,
      AssetsPage.currencyLink,
      AssetsPage.currencyDaiCap,
    ]

    // Disable dust filter to see tokens with no fiat value
    await assets.toggleHideDust(false)

    // Verify default tokens list shows only native token
    await assets.toggleShowAllTokens(false)
    await assets.verifyValuesExist('table[aria-labelledby="tableTitle"]', [constants.tokenNames.sepoliaEther])
    await assets.verifyValuesDoNotExist('table[aria-labelledby="tableTitle"]', spamTokens)

    // Verify all tokens list shows spam tokens
    await assets.toggleShowAllTokens(true)
    const allTokens = [...spamTokens, constants.tokenNames.sepoliaEther]
    await assets.verifyValuesExist('table[aria-labelledby="tableTitle"]', allTokens)

    // Verify dust filter hides tokens with no value
    await assets.toggleHideDust(true)
    await assets.verifyValuesExist('table[aria-labelledby="tableTitle"]', [constants.tokenNames.sepoliaEther])
    await assets.verifyValuesDoNotExist('table[aria-labelledby="tableTitle"]', [AssetsPage.currencyAave])
  })
})
