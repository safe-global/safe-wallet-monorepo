import * as constants from '../../support/constants'
import * as assets from '../pages/assets.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

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

  it('Verify that when owner is disconnected, Send button is disabled', () => {
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })

  it('Verify that when connected user is not owner, Send button is disabled', () => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_3)
    assets.toggleShowAllTokens(true)
    assets.toggleHideDust(false)
    assets.showSendBtn(0)
    assets.VerifySendButtonIsDisabled()
  })
})
