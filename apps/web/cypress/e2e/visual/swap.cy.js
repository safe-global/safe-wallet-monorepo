import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe('[VISUAL] Swap page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot swap page', () => {
    main.enableChainFeature(constants.chainFeatures.nativeSwaps)
    cy.visit(constants.swapUrl + staticSafes.SEP_STATIC_SAFE_2)
    main.awaitVisualStability()
  })
})
