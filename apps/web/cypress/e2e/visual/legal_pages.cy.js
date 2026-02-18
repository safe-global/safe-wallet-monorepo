import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'

describe('[VISUAL] Legal page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  it('[VISUAL] Screenshot terms page', () => {
    cy.visit(constants.termsUrl)
    cy.contains('Terms', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot privacy policy page', () => {
    cy.visit(constants.privacyUrl)
    cy.contains('Privacy', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot licenses page', () => {
    cy.visit(constants.licensesUrl)
    cy.contains('Licenses', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot imprint page', () => {
    cy.visit(constants.imprintUrl)
    cy.contains('Imprint', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot cookie policy page', () => {
    cy.visit(constants.cookiePolicyUrl)
    cy.contains('Cookie', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot Safe Labs terms page', () => {
    cy.visit(constants.safeLabsTermsUrl)
    cy.contains('Welcome to Safe', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
