import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as safeapps from '../pages/safeapps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let $dapps,
  staticSafes = []
const app1 = 'https://app1.com'
const app3 = 'https://app3.com'

describe('Permissions settings tests', () => {
  before(() => {
    getSafes(CATEGORIES.static).then((statics) => {
      staticSafes = statics
      cy.on('window:before:load', (window) => {
        window.localStorage.setItem(
          constants.BROWSER_PERMISSIONS_KEY,
          JSON.stringify({
            app1: [
              { feature: 'camera', status: 'granted' },
              { feature: 'fullscreen', status: 'granted' },
              { feature: 'geolocation', status: 'granted' },
            ],
            app2: [{ feature: 'microphone', status: 'granted' }],
            app3: [{ feature: 'camera', status: 'denied' }],
          }),
        )
        window.localStorage.setItem(
          constants.SAFE_PERMISSIONS_KEY,
          JSON.stringify({
            app2: [
              {
                invoker: app1,
                parentCapability: 'requestAddressBook',
                date: 1666103778276,
                caveats: [],
              },
            ],
            app4: [
              {
                invoker: app3,
                parentCapability: 'requestAddressBook',
                date: 1666103787026,
                caveats: [],
              },
            ],
          }),
        )
      })
      cy.visit(`${constants.appSettingsUrl}?safe=${staticSafes.SEP_STATIC_SAFE_2}`, {
        failOnStatusCode: false,
      })
      main.acceptCookies2()
    })
  })

  it('Verify for each stored app the permissions configuration is shown', () => {
    cy.findAllByRole('heading', { level: 5 }).should('have.length', 4)
  })

  describe('Permissions for each Safe app', () => {
    before(() => {
      cy.get(safeapps.gridItem).then((items) => {
        $dapps = items
      })
    })

    it('Verify that app1 has camera, full screen and geo permissions', () => {
      const app1Data = [
        'app1',
        safeapps.permissionCheckboxNames.camera,
        safeapps.permissionCheckboxNames.fullscreen,
        safeapps.permissionCheckboxNames.geolocation,
      ]

      main.checkTextsExistWithinElement($dapps[0], app1Data)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.camera, 0, constants.checkboxStates.checked)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.geolocation, 0, constants.checkboxStates.checked)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.fullscreen, 0, constants.checkboxStates.checked)
    })

    it('Verify that app2 has address book and microphone permissions', () => {
      const app2Data = [
        'app2',
        safeapps.permissionCheckboxNames.addressbook,
        safeapps.permissionCheckboxNames.microphone,
      ]

      main.checkTextsExistWithinElement($dapps[1], app2Data)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.microphone, 0, constants.checkboxStates.checked)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.addressbook, 0, constants.checkboxStates.checked)
    })

    it('Verify that app3 has camera permissions', () => {
      const app3Data = ['app3', safeapps.permissionCheckboxNames.camera]

      main.checkTextsExistWithinElement($dapps[2], app3Data)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.camera, 1, constants.checkboxStates.unchecked)
    })

    it('Verify that app4 has address book permissions', () => {
      const app4Data = ['app4', safeapps.permissionCheckboxNames.addressbook]

      main.checkTextsExistWithinElement($dapps[3], app4Data)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.addressbook, 1, constants.checkboxStates.checked)
    })

    it('Verify Allow all or Clear all the checkboxes at once is permitted', () => {
      safeapps.uncheckAllPermissions($dapps[1])
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.addressbook, 0, constants.checkboxStates.unchecked)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.microphone, 0, constants.checkboxStates.unchecked)

      safeapps.checkAllPermissions($dapps[1])
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.addressbook, 0, constants.checkboxStates.checked)
      main.verifyCheckboxeState(safeapps.permissionCheckboxes.microphone, 0, constants.checkboxStates.checked)
    })

    it('Verify it is permitted to remove apps and reflect it in the localStorage', () => {
      cy.wrap($dapps[0]).find('svg').last().click()
      cy.wrap($dapps[2])
        .find('svg')
        .last()
        .click()
        .should(() => {
          const storedBrowserPermissions = JSON.parse(localStorage.getItem(constants.BROWSER_PERMISSIONS_KEY))
          const browserPermissions = Object.values(storedBrowserPermissions)

          expect(browserPermissions).to.have.length(1)
          expect(browserPermissions[0][0].feature).to.eq('microphone')
          expect(browserPermissions[0][0].status).to.eq('granted')

          const storedSafePermissions = JSON.parse(localStorage.getItem(constants.SAFE_PERMISSIONS_KEY))
          const safePermissions = Object.values(storedSafePermissions)

          expect(safePermissions).to.have.length(2)
          expect(safePermissions[0][0].parentCapability).to.eq('requestAddressBook')
          expect(safePermissions[1][0].parentCapability).to.eq('requestAddressBook')
        })
    })
  })
})
