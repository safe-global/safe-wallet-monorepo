import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Stake page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot stake page', () => {
    main.enableChainFeature(constants.chainFeatures.staking)
    cy.visit(constants.stakingUrl + staticSafes.SEP_STATIC_SAFE_2)
    main.verifySkeletonsGone()
  })
})
