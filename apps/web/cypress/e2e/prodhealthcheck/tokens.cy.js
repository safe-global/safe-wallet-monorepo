import * as constants from '../../support/constants'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

const TOKEN_AMOUNT_COLUMN = 1
const FIAT_AMOUNT_COLUMN = 2

let staticSafes = []

describe('[PROD] Prod tokens tests', () => {
  const value = '--'

  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains(createTx.assetsStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
  })

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

  it('Verify that when owner is disconnected, Send button is disabled', () => {
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })

  it('Verify that when connected user is not owner, Send button is disabled', () => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_3)
    assets.selectTokenList(assets.tokenListOptions.allTokens)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
