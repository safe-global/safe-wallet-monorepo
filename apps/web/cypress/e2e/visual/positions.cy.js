import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Positions page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot DeFi positions page', () => {
    main.enableChainFeature(constants.chainFeatures.positions)
    cy.visit(constants.positionsUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.contains('Positions', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
