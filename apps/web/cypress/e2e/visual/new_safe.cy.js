import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safe from '../pages/load_safe.pages.js'

describe('[VISUAL] New safe form screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  it('[VISUAL] Screenshot create new safe form', () => {
    cy.visit(constants.createNewSafeSepoliaUrl)
    cy.contains('Create new Safe Account', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot load existing safe form', () => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
    cy.contains('Add existing Safe Account', { timeout: 30000 }).should('be.visible')
    // Skip verifySkeletonsGone — the load form has a persistent circular skeleton for the identicon placeholder
  })

  it('[VISUAL] Screenshot load safe with invalid address error', () => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
    cy.contains('Add existing Safe Account', { timeout: 30000 }).should('be.visible')
    safe.verifyIncorrectAddressErrorMessage()
    // Skip verifySkeletonsGone — the load form has a persistent circular skeleton for the identicon placeholder
  })
})
