import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as space from '../pages/spaces.page.js'
import * as ls from '../../support/localstorage_data.js'
import { signInToSpaces } from '../../support/spaces-login.js'
import staticSpaces from '../../fixtures/spaces/staticSpaces.js'

const SPACE_ID = staticSpaces.dashboardWithSafes.uuid

describe(
  '[VISUAL] Spaces address book screenshots',
  { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT },
  () => {
    beforeEach(() => {
      signInToSpaces()
    })

    it('[VISUAL] Screenshot spaces address book workspace contacts tab', () => {
      cy.visit(constants.spaceAddressBookUrl + SPACE_ID)
      main.awaitVisualStability()
    })

    it.skip('[VISUAL] Screenshot spaces address book local contacts tab', () => {
      cy.visit(constants.spaceAddressBookUrl + SPACE_ID, {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            constants.localStorageKeys.SAFE_v2__addressBook,
            JSON.stringify(ls.addressBookData.sepoliaAddress1),
          )
        },
      })
      space.clickAddressBookTab(space.addressBookTabLocal)
      main.awaitVisualStability()
    })

    it.skip('[VISUAL] Screenshot spaces address book pending tab', () => {
      cy.visit(constants.spaceAddressBookUrl + SPACE_ID)
      space.clickAddressBookTab(space.addressBookTabPending)
      main.awaitVisualStability()
    })
  },
)
