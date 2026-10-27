import * as constants from '../../support/constants'
import * as safeNav from '../pages/safe_navigation.pages'
import * as assets from '../pages/assets.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Safe selector tests - details and currency', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify fiat currency changes when edited in the assets tab are reflected in the safe selector trigger', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    assets.changeCurrency(assets.currencyCAD)
    safeNav.verifyCurrencySection(assets.currency$)
  })
})
