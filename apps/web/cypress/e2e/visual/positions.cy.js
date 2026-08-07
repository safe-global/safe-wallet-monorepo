import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let fundsSafes = []

describe('[VISUAL] Positions page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    fundsSafes = await getSafes(CATEGORIES.funds)
  })

  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot DeFi positions page', () => {
    cy.visit(constants.positionsUrl + fundsSafes.MAINNET_SAFE)
    main.awaitVisualStability()
  })
})
