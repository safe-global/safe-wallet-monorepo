import * as file from '../pages/import_export.pages'
import * as main from '../pages/main.page'
import * as constants from '../../support/constants'
import * as ls from '../../support/localstorage_data.js'
import * as sideBar from '../pages/sidebar.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Import Export Data tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.dataSettingsUrl)
  })

  it('[SMOKE] Verify Safe can be accessed after test file upload', () => {
    const safe = constants.SEPOLIA_CSV_ENTRY.name

    cy.wrap(null)
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.importedSafe),
      )
      .then(() => {
        cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4)
        return sideBar.openSidebar()
      })
      .then(() => {
        return file.clickOnImportedSafe(safe)
      })
  })

  it('[SMOKE] Verify address book imported data', () => {
    cy.wrap(null)
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.importedSafe),
      )
      .then(() => {
        cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_13)
        file.verifyImportedAddressBookData()
      })
  })

  it('[SMOKE] Verify pinned apps', () => {
    const appNames = ['Transaction Builder']
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_13)
      .then(() => cy.wrap(null))
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.importedSafe),
      )
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__safeApps, ls.pinnedApps.transactionBuilder),
      )
      .then(() => {
        cy.reload()
        file.verifyPinnedApps(appNames)
      })
  })

  it('[SMOKE] Verify imported data in settings', () => {
    const unchecked = [file.copyAddressStr]
    const checked = [file.darkModeStr]
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13)
      .then(() => cy.wrap(null))
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__safeApps, ls.pinnedApps.transactionBuilder),
      )
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.importedSafe),
      )
      .then(() => {
        cy.reload()
        file.clickOnAppearenceBtn()
        file.verifyCheckboxes(unchecked)
        file.verifyCheckboxes(checked, true)
      })
  })

  it('[SMOKE] Verify data for export in Data tab', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13)
      .then(() => cy.wrap(null))
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__settings, ls.safeSettings.settings1))
      .then(() => main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1))
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__safeApps, ls.pinnedApps.transactionBuilder),
      )
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.importedSafe),
      )
      .then(() => {
        cy.reload()
        file.clickOnDataTab()
        file.verifyImportModalData()
        file.verifyFileDownload()
      })
  })
})
