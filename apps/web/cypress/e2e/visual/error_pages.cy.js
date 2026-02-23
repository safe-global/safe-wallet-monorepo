import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'

describe('[VISUAL] Error page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  it('[VISUAL] Screenshot 404 page', () => {
    cy.visit(constants.error404Url, { failOnStatusCode: false })
    cy.contains('404', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })

  it('[VISUAL] Screenshot 403 page', () => {
    cy.visit(constants.error403Url, { failOnStatusCode: false })
    cy.contains('403', { timeout: 30000 }).should('be.visible')
    main.verifySkeletonsGone()
  })
})
