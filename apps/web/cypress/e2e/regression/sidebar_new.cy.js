import * as constants from '../../support/constants'
import * as sideBar from '../pages/sidebar.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Sidebar tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Disconnected', () => {
    beforeEach(() => {
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_9)
    })

    it('Verify the side menu buttons exist', () => {
      sideBar.verifySideListItemsNew()
    })
  })
})
