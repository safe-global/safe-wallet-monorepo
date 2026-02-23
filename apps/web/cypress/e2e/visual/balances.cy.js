import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as assets from '../pages/assets.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Balances screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot balances page', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot balances with all tokens visible', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains(constants.tokenNames.sepoliaEther, { timeout: 30000 }).should('be.visible')
    assets.toggleHideDust(false)
    assets.toggleShowAllTokens(true)
    main.waitForMuiAnimationsToSettle()
    main.verifySkeletonsGone()
  })
})
