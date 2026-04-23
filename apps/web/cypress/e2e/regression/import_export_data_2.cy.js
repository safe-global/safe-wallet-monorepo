import * as file from '../pages/import_export.pages.js'
import * as constants from '../../support/constants.js'
import * as safeNav from '../pages/safe_navigation.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const validJsonPath = 'cypress/fixtures/data_import.json'
const invalidJsonPath = 'cypress/fixtures/address_book_test.csv'
const invalidJsonPath_2 = 'cypress/fixtures/balances.json'
const invalidJsonPath_3 = 'cypress/fixtures/test-empty-batch.json'

const appNames = ['Transaction Builder']

describe('Import Export Data tests 2', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.welcomeAccountUrl)
  })

  it('Verify that the Import button opens an import modal', () => {
    safeNav.clickOnImportBtn()
  })

  it('Verify that correctly formatted json file can be uploaded and shows data', () => {
    safeNav.clickOnImportBtn()
    file.dragAndDropFile(validJsonPath)
    file.verifyImportMessages()
    file.verifyImportBtnStatus(constants.enabledStates.enabled)
    file.clickOnImportBtn()
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_13)
    file.verifyImportedAddressBookData()
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_13)
    file.verifyPinnedApps(appNames)
  })

  it('Verify that only json files can be imported', () => {
    safeNav.clickOnImportBtn()
    file.dragAndDropFile(invalidJsonPath)
    file.verifyErrorOnUpload()
    file.verifyImportBtnStatus(constants.enabledStates.disabled)
  })

  it('Verify that json files with wrong information are rejected', () => {
    safeNav.clickOnImportBtn()
    file.dragAndDropFile(invalidJsonPath_3)
    file.verifyUploadErrorMessage(file.importErrorMessages.noImportableData)
    file.clickOnCancelBtn()
    safeNav.clickOnImportBtn()
    file.dragAndDropFile(invalidJsonPath_2)
    file.verifyUploadErrorMessage(file.importErrorMessages.noImportableData)
    file.clickOnCancelBtn()
  })
})
