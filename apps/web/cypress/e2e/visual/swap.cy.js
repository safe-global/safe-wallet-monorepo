import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[VISUAL] Swap page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[VISUAL] Screenshot swap page', () => {
    // Intercept chain config to enable NATIVE_SWAPS feature
    cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
      req.continue((res) => {
        if (res.body && res.body.features) {
          if (!res.body.features.includes(constants.chainFeatures.nativeSwaps)) {
            res.body.features.push(constants.chainFeatures.nativeSwaps)
          }
        }
      })
    })
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_2)
    main.verifySkeletonsGone()
  })
})
