import * as constants from '../../support/constants'
import * as addressBook from '../../e2e/pages/address_book.page'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Address book tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.intercept('GET', constants.transactionHistoryEndpoint).as('History')
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          constants.localStorageKeys.SAFE_v2__addressBook,
          JSON.stringify(ls.addressBookData.sepoliaAddress1),
        )
      },
    })
    cy.wait('@History', { timeout: 20000 })
  })

  it('[SMOKE] Verify empty name is not allowed when editing', () => {
    addressBook.clickOnEditEntryBtn()
    addressBook.verifyEmptyOwnerNameNotAllowed()
  })
})
