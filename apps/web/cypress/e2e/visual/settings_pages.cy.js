import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe('[VISUAL] Settings pages screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot setup page', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot appearance settings page', () => {
    cy.visit(constants.appearanceSettingsUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot modules page', () => {
    cy.visit(constants.modulesUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot notifications settings page', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.awaitVisualStability()
  })
})
