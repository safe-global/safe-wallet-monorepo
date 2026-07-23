import * as file from '../pages/import_export.pages'
import * as constants from '../../support/constants'
import * as ls from '../../support/localstorage_data.js'
import * as selector from '../pages/safe_navigation.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const seedStorage = (entries) => (win) => {
  Object.entries(entries).forEach(([key, value]) => win.localStorage.setItem(key, JSON.stringify(value)))
}

describe('[SMOKE] Import Export Data tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify Safe can be accessed after test file upload', () => {
    const safe = constants.SEPOLIA_CSV_ENTRY.name

    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4, {
      onBeforeLoad: seedStorage({
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.importedSafe,
      }),
    })
    selector.openSelector()
    selector.verifyItemExistsInSelector(safe)
    selector.clickOnSafe(safe)
  })

  it('[SMOKE] Verify address book imported data', () => {
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_13, {
      onBeforeLoad: seedStorage({
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.importedSafe,
      }),
    })
    file.verifyImportedAddressBookData()
  })

  it('[SMOKE] Verify pinned apps', () => {
    const appNames = ['Transaction Builder']
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_13, {
      onBeforeLoad: seedStorage({
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.importedSafe,
        [constants.localStorageKeys.SAFE_v2__safeApps]: ls.pinnedApps.transactionBuilder,
      }),
    })
    file.verifyPinnedApps(appNames)
  })

  it('[SMOKE] Verify imported data in settings', () => {
    const checked = [file.darkModeStr]
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13, {
      onBeforeLoad: seedStorage({
        [constants.localStorageKeys.SAFE_v2__settings]: ls.safeSettings.settings1,
        [constants.localStorageKeys.SAFE_v2__safeApps]: ls.pinnedApps.transactionBuilder,
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.importedSafe,
      }),
    })
    file.clickOnAppearenceBtn()
    file.verifyCheckboxes(checked, true)
  })

  it('[SMOKE] Verify data for export in Data tab', () => {
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_13, {
      onBeforeLoad: seedStorage({
        [constants.localStorageKeys.SAFE_v2__settings]: ls.safeSettings.settings1,
        [constants.localStorageKeys.SAFE_v2__addedSafes]: ls.addedSafes.set1,
        [constants.localStorageKeys.SAFE_v2__safeApps]: ls.pinnedApps.transactionBuilder,
        [constants.localStorageKeys.SAFE_v2__addressBook]: ls.addressBookData.importedSafe,
      }),
    })
    file.clickOnDataTab()
    file.verifyImportModalData()
    file.verifyFileDownload()
  })
})
