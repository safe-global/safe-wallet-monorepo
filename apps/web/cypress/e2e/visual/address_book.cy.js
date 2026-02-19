import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as addressBook from '../pages/address_book.page.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { mockVisualTestApis } from '../../support/visual-mocks.js'

let staticSafes = []

describe('[VISUAL] Address book screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    mockVisualTestApis()
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress1)
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
    cy.reload()
    cy.contains('Owner1', { timeout: 30000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot address book page with entries', () => {
    main.awaitVisualStability()
  })

  it('[VISUAL] Screenshot address book edit entry with empty name error', () => {
    addressBook.clickOnEditEntryBtn()
    cy.get(main.nameInput).clear()
    main.awaitVisualStability()
  })
})
