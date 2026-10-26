import * as constants from '../../support/constants.js'
import * as addressBook from '../pages/address_book.page.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const NAME = 'Owner1'
const EDITED_NAME = 'Edited Owner1'

describe('Address book tests - 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  describe('Without pre-seeded data', () => {
    beforeEach(() => {
      cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
    })

    it('Verify entry can be added', () => {
      addressBook.clickOnCreateEntryBtn()
      addressBook.addEntry(NAME, constants.RECIPIENT_ADDRESS)
    })
  })

  describe('With pre-seeded data', () => {
    const seedAddressBook = (value) => (win) =>
      win.localStorage.setItem(constants.localStorageKeys.SAFE_v2__addressBook, JSON.stringify(value))

    it('Verify entry can be deleted', () => {
      cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4, {
        onBeforeLoad: seedAddressBook(ls.addressBookData.sepoliaAddress1),
      })
      addressBook.clickDeleteEntryButton()
      addressBook.clickDeleteEntryModalDeleteButton()
      addressBook.verifyEditedNameNotExists(EDITED_NAME)
    })
  })
})
