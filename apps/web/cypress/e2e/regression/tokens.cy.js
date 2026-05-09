import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

let staticSafes = []

describe('Tokens tests', () => {
  const value = '--'

  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  beforeEach(() => {
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__tokenlist_onboarding,
      ls.cookies.acceptedTokenListOnboarding,
    )
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
  })

  // Added to prod
  it('Verify that non-native tokens are present and have balance', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.verifyBalance(assets.currencyDaiCap, assets.currencyDaiAlttext, assets.currencyDaiBalance, value)
    assets.verifyBalance(assets.currencyAave, assets.currencyAaveAlttext, assets.currencyAaveBalance, value)
    assets.verifyBalance(assets.currencyLink, assets.currencyLinkAlttext, assets.currencyLinkBalance, value)
    assets.verifyBalance(
      assets.currencyTestTokenA,
      assets.currencyTestTokenAAlttext,
      assets.currencyTestTokenABalance,
      value,
    )
    assets.verifyBalance(
      assets.currencyTestTokenB,
      assets.currencyTestTokenBAlttext,
      assets.currencyTestTokenBBalance,
      value,
    )
    assets.verifyBalance(assets.currencyUSDC, assets.currencyTestUSDCAlttext, assets.currencyUSDCBalance, value)
  })

  it('Verify that every token except the native token has a "go to blockexplorer link"', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.verifyAssetNameHasExplorerLink(assets.currencyUSDC)
    assets.verifyAssetNameHasExplorerLink(assets.currencyTestTokenB)
    assets.verifyAssetNameHasExplorerLink(assets.currencyTestTokenA)
    assets.verifyAssetNameHasExplorerLink(assets.currencyLink)
    assets.verifyAssetNameHasExplorerLink(assets.currencyAave)
    assets.verifyAssetNameHasExplorerLink(assets.currencyDaiCap)
    assets.verifyAssetExplorerLinkNotAvailable(constants.tokenNames.sepoliaEther)
  })

  it('Verify the default Fiat currency and the effects after changing it', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.verifyFirstRowDoesNotContainCurrency(assets.currencyEUR)
    assets.verifyFirstRowContainsCurrency(assets.currency$)
    assets.clickOnCurrencyDropdown()
    assets.selectCurrency(assets.currencyOptionEUR)
    assets.verifyFirstRowDoesNotContainCurrency(assets.currency$)
    assets.verifyFirstRowContainsCurrency(assets.currencyEUR)
  })

  it('Verify that checking the checkboxes increases the token selected counter', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.checkTokenCounter(1)
  })

  it('Verify that selecting tokens and saving hides them from the table', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.saveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink])
  })

  it('Verify that Cancel closes the menu and does not change the table status', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.saveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink, assets.currencyAave])
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.cancelSaveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink, assets.currencyAave])
  })

  it('Verify that Deselect All unchecks all tokens from the list', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.deselecAlltHiddenTokenSelection()
    assets.verifyEachRowHasCheckbox(constants.checkboxStates.unchecked)
  })

  it('Verify the Hidden tokens counter works for spam tokens', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.saveHiddenTokenSelection()
    assets.checkHiddenTokenBtnCounter(1)
  })

  it('Verify the Hidden tokens counter works for native tokens', () => {
    assets.openHiddenTokensFromManageMenu()
    assets.clickOnTokenCheckbox(constants.tokenNames.sepoliaEther)
    assets.saveHiddenTokenSelection()
    assets.checkHiddenTokenBtnCounter(1)
  })

  it('Verify the sorting of "Assets" and "Balance" in the table', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.verifyTableRows(7)
    assets.clickOnTokenNameSortBtn()
    assets.verifyTokenNamesOrder()
    assets.clickOnTokenNameSortBtn()
    assets.verifyTokenNamesOrder('descending')
    assets.clickOnTokenBalanceSortBtn()
    assets.verifyTokenBalanceOrder()
    assets.clickOnTokenBalanceSortBtn()
    assets.verifyTokenBalanceOrder('descending')
  })

  // Added to prod
  it('Verify that when connected user is not owner, Send button is disabled', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_3)
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
