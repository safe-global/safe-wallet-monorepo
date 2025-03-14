import * as constants from '../../support/constants'
import * as safeapps from '../pages/safeapps.pages'
import * as main from '../pages/main.page'
import * as ls from '../../support/localstorage_data.js'

describe('Safe permissions system tests', () => {
  beforeEach(() => {
    cy.fixture('safe-app').then((html) => {
      cy.intercept('GET', `${constants.testAppUrl}/*`, html)
      cy.intercept('GET', `*/manifest.json`, {
        name: constants.testAppData.name,
        description: constants.testAppData.descr,
        icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
      })
    })
  })

  // Skipped due to test app availability
  it.skip('Verify that requesting permissions with wallet_requestPermissions shows the permissions prompt and return the permissions on accept', () => {
    cy.visitSafeApp(constants.testAppUrl + constants.requestPermissionsUrl)
    safeapps.verifyPermissionsRequestExists()
    safeapps.verifyAccessToAddressBookExists()
    safeapps.clickOnAcceptBtn()

    cy.get('@safeAppsMessage').should('have.been.calledWithMatch', {
      data: [
        {
          invoker: constants.testAppUrl,
          parentCapability: 'requestAddressBook',
          date: Cypress.sinon.match.number,
          caveats: [],
        },
      ],
    })
  })

  // Skipped due to test app availability
  it.skip('Verify that trying to get the current permissions with wallet_getPermissions returns the current permissions', () => {
    cy.on('window:before:load', (window) => {
      window.localStorage.setItem(
        constants.SAFE_PERMISSIONS_KEY,
        JSON.stringify({
          [constants.testAppUrl]: [
            {
              invoker: constants.testAppUrl,
              parentCapability: 'requestAddressBook',
              date: 1111111111111,
              caveats: [],
            },
          ],
        }),
      )
    })

    cy.visitSafeApp(constants.testAppUrl + constants.getPermissionsUrl)
    cy.get('@safeAppsMessage').should('have.been.calledWithMatch', {
      data: [
        {
          invoker: constants.testAppUrl,
          parentCapability: 'requestAddressBook',
          date: Cypress.sinon.match.number,
          caveats: [],
        },
      ],
    })
  })
})
