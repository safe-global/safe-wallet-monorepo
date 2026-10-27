import * as constants from '../../support/constants.js'
import * as addressBook from '../pages/address_book.page.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const owner1 = 'Automation owner'
const onwer2 = 'Changed Automation owner'

describe('Address book tests - 2', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  const seedAddressBook = (value) => (win) =>
    win.localStorage.setItem(constants.localStorageKeys.SAFE_v2__addressBook, JSON.stringify(value))

  it('Verify that edit owners name changes the name in the settings', () => {
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4, {
      onBeforeLoad: seedAddressBook(ls.addressBookData.sepoliaAddress2),
    })
    addressBook.clickOnEditEntryBtn()
    addressBook.typeInNameInput(onwer2)
    addressBook.clickOnSaveEntryBtn()
    addressBook.verifyNameWasChanged(owner1, onwer2)
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
    addressBook.verifyNameWasChanged(owner1, onwer2)
  })
})
