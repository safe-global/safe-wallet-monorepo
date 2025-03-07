import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as safeapps from '../pages/safeapps.pages'

describe('Browser permissions tests', () => {
  beforeEach(() => {
    cy.fixture('safe-app').then((html) => {
      cy.intercept('GET', `${constants.testAppUrl}/*`, html)
      cy.intercept('GET', `*/manifest.json`, {
        name: constants.testAppData.name,
        description: constants.testAppData.descr,
        icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
        safe_apps_permissions: ['camera', 'microphone'],
      })
    })
    cy.visitSafeApp(`${constants.testAppUrl}/app`)
  })

  // @TODO: unknown apps don't have permissions
  it.skip('Verify a permissions slide to the user is displayed', () => {
    safeapps.clickOnContinueBtn()
    safeapps.verifyCameraCheckBoxExists()
    safeapps.verifyMicrofoneCheckBoxExists()
  })

  it.skip('Verify the selection can be changed, accepted and stored', () => {
    safeapps.verifyMicrofoneCheckBoxExists().click()
    safeapps.clickOnContinueBtn()
    safeapps.verifyWarningDefaultAppMsgIsDisplayed()
    safeapps.verifyCameraCheckBoxExists()
    safeapps.clickOnContinueBtn()
    safeapps.checkLocalStorage()
  })
})
