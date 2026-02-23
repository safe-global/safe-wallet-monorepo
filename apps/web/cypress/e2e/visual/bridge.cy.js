import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Bridge page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot bridge page', () => {
    main.enableChainFeature(constants.chainFeatures.bridge)
    cy.visit(constants.bridgeUrl + staticSafes.SEP_STATIC_SAFE_2)
    main.verifySkeletonsGone()
  })
})
