import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

describe('[VISUAL] Legal page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  beforeEach(() => {
    mockVisualTestApis()
  })

  it('[VISUAL] Screenshot terms page', () => {
    cy.visit(constants.termsUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot privacy policy page', () => {
    cy.visit(constants.privacyUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot licenses page', () => {
    cy.visit(constants.licensesUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot imprint page', () => {
    cy.visit(constants.imprintUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot cookie policy page', () => {
    cy.visit(constants.cookiePolicyUrl)
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot Safe Labs terms page', () => {
    cy.visit(constants.safeLabsTermsUrl)
    main.awaitVisualStability()
  })
})
