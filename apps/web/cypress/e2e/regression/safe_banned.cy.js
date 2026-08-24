import * as constants from '../../support/constants'
import * as errorScreen from '../pages/safe_loading_error.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

const legalBlockMessage = 'Unavailable for legal reasons'
const genericLoadingError = "This Safe account couldn't be loaded"

let staticSafes = []

describe('Banned Safe regression tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that a Safe banned for legal reasons shows the message returned by the backend', () => {
    cy.intercept('GET', constants.safeInfoEndpoint, {
      statusCode: 451,
      body: { code: 451, message: legalBlockMessage },
    }).as('safeInfo')

    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.wait('@safeInfo')

    errorScreen.verifySafeLoadingErrorMessage(legalBlockMessage)
    errorScreen.verifySafeLoadingErrorMessageNotVisible(genericLoadingError)
    errorScreen.verifyMainPageButtonIsVisible()
  })

  it('Verify that a Safe that fails to load for another reason keeps the generic message', () => {
    cy.intercept('GET', constants.safeInfoEndpoint, {
      statusCode: 500,
      body: { code: 500, message: 'Internal server error' },
    }).as('safeInfo')

    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.wait('@safeInfo')

    errorScreen.verifySafeLoadingErrorMessage(genericLoadingError)
    errorScreen.verifySafeLoadingErrorMessageNotVisible('Internal server error')
    errorScreen.verifyMainPageButtonIsVisible()
  })
})
