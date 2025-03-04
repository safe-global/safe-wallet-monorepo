import 'cypress-file-upload'
import * as constants from '../../support/constants'
import * as addressBook from '../../e2e/pages/address_book.page'
import * as main from '../../e2e/pages/main.page'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Address book tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
    main.waitForHistoryCallToComplete()
  })

  it('[SMOKE] Verify empty name is not allowed when editing', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress1)
    cy.wait(1000)
    cy.reload()
    addressBook.clickOnEditEntryBtn()
    addressBook.verifyEmptyOwnerNameNotAllowed()
  })
})
