import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'

const ASSET_NAME_COLUMN = 0
const TOKEN_AMOUNT_COLUMN = 1
const FIAT_AMOUNT_COLUMN = 2

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
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.verifyBalance(assets.currencyDaiCap, TOKEN_AMOUNT_COLUMN, assets.currencyDaiAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyDaiCap,
      assets.currencyDaiFormat_2,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )

    assets.verifyBalance(assets.currencyAave, TOKEN_AMOUNT_COLUMN, assets.currencyAaveAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyAave,
      assets.currentcyAaveFormat,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )

    assets.verifyBalance(assets.currencyLink, TOKEN_AMOUNT_COLUMN, assets.currencyLinkAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyLink,
      assets.currentcyLinkFormat,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )

    assets.verifyBalance(assets.currencyTestTokenA, TOKEN_AMOUNT_COLUMN, assets.currencyTestTokenAAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyTestTokenA,
      assets.currentcyTestTokenAFormat,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )

    assets.verifyBalance(assets.currencyTestTokenB, TOKEN_AMOUNT_COLUMN, assets.currencyTestTokenBAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyTestTokenB,
      assets.currentcyTestTokenBFormat,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )

    assets.verifyBalance(assets.currencyUSDC, TOKEN_AMOUNT_COLUMN, assets.currencyTestUSDCAlttext)
    assets.verifyTokenBalanceFormat(
      assets.currencyUSDC,
      assets.currentcyTestUSDCFormat,
      TOKEN_AMOUNT_COLUMN,
      FIAT_AMOUNT_COLUMN,
      value,
    )
  })

  it('Verify that every token except the native token has a "go to blockexplorer link"', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.verifyAssetNameHasExplorerLink(assets.currencyUSDC, ASSET_NAME_COLUMN)
    assets.verifyAssetNameHasExplorerLink(assets.currencyTestTokenB, ASSET_NAME_COLUMN)
    assets.verifyAssetNameHasExplorerLink(assets.currencyTestTokenA, ASSET_NAME_COLUMN)
    assets.verifyAssetNameHasExplorerLink(assets.currencyLink, ASSET_NAME_COLUMN)
    assets.verifyAssetNameHasExplorerLink(assets.currencyAave, ASSET_NAME_COLUMN)
    assets.verifyAssetNameHasExplorerLink(assets.currencyDaiCap, ASSET_NAME_COLUMN)
    assets.verifyAssetExplorerLinkNotAvailable(constants.tokenNames.sepoliaEther, ASSET_NAME_COLUMN)
  })

  it('Verify the default Fiat currency and the effects after changing it', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.verifyFirstRowDoesNotContainCurrency(assets.currencyEUR, FIAT_AMOUNT_COLUMN)
    assets.verifyFirstRowContainsCurrency(assets.currency$, FIAT_AMOUNT_COLUMN)
    assets.clickOnCurrencyDropdown()
    assets.selectCurrency(assets.currencyOptionEUR)
    assets.verifyFirstRowDoesNotContainCurrency(assets.currency$, FIAT_AMOUNT_COLUMN)
    assets.verifyFirstRowContainsCurrency(assets.currencyEUR, FIAT_AMOUNT_COLUMN)
  })

  it('Verify that checking the checkboxes increases the token selected counter', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.checkTokenCounter(1)
  })

  it('Verify that selecting tokens and saving hides them from the table', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.saveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink])
  })

  it('Verify that Cancel closes the menu and does not change the table status', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.saveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink, assets.currencyAave])
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.cancelSaveHiddenTokenSelection()
    main.verifyValuesDoNotExist(assets.tokenListTable, [assets.currencyLink, assets.currencyAave])
  })

  it('Verify that Deselect All unchecks all tokens from the list', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.clickOnTokenCheckbox(assets.currencyAave)
    assets.deselecAlltHiddenTokenSelection()
    assets.verifyEachRowHasCheckbox(constants.checkboxStates.unchecked)
  })

  it('Verify the Hidden tokens counter works for spam tokens', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(assets.currencyLink)
    assets.saveHiddenTokenSelection()
    assets.checkHiddenTokenBtnCounter(1)
  })

  it('Verify the Hidden tokens counter works for native tokens', () => {
    assets.openHideTokenMenu()
    assets.clickOnTokenCheckbox(constants.tokenNames.sepoliaEther)
    assets.saveHiddenTokenSelection()
    assets.checkHiddenTokenBtnCounter(1)
  })

  it('Verify you can hide tokens from the eye icon in the table rows', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.hideAsset(assets.currencyLink)
  })

  it('Verify the sorting of "Assets" and "Balance" in the table', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
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
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
