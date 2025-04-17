import * as constants from '../../support/constants'
import * as safeapps from '../pages/safeapps.pages'

describe('Browser permissions tests', () => {
  beforeEach(() => {
    cy.fixture('safe-app').then((html) => {
      cy.intercept('GET', `${constants.TX_Builder_url}/*`, html)
      cy.intercept('GET', `*/manifest.json`, {
        name: constants.testAppData.name,
        description: constants.testAppData.descr,
        icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
        safe_apps_permissions: ['camera', 'microphone'],
      })
    })
    cy.visitSafeApp(`${constants.TX_Builder_url}`)
  })

  it('Verify a permissions slide to the user is displayed', () => {
    safeapps.verifyCameraCheckBoxExists()
    safeapps.verifyMicrofoneCheckBoxExists()
  })

  it('Verify the selection can be changed, accepted and stored', () => {
    safeapps.verifyMicrofoneCheckBoxExists().click()
    safeapps.verifyCameraCheckBoxExists()
    safeapps.checkLocalStorage()
  })
})
