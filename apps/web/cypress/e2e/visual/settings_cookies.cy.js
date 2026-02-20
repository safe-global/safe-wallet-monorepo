import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe('[VISUAL] Cookie settings screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot cookie preferences page', () => {
    cy.visit(constants.cookiesUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.contains('Cookie preferences', { timeout: 30000 }).should('be.visible')
    main.awaitVisualStability()
  })
})
