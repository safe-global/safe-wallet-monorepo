import * as constants from '../../support/constants'
import * as main from '../pages/main.page.js'
const path = require('path')

const pinnedAppsStr = 'My pinned apps'
const addressBookBtnStr = 'Address book'
const appsBtnStr = 'Apps'
const bookmarkedAppsBtnStr = 'Bookmarked apps'
const settingsBtnStr = 'Settings'
const showMoreTabsBtn = '[data-testid="KeyboardArrowRightIcon"]'
const dataTabStr = 'Data'
const tab = 'div[role="tablist"] a'
const importDialog = 'div[role="dialog"]'
const dialogImportBtn = '[data-testid="dialog-import-btn"]'
const dialogCancelBtn = '[data-testid="dialog-cancel-btn"]'
const fileUploadSection = '[data-testid="file-upload-section"]'

// Import messages for data_import.json
const importMessages = [
  'Added Safe accounts on 4 chains',
  'Address book for 4 chains',
  'Address book for 4 chains',
  'Settings (appearance, currency, hidden tokens and custom environment variables)',
  'Bookmarked Safe Apps',
]

export const importErrorMessages = {
  noImportableData: 'This file contains no importable data.',
}

const colors = {
  pink: 'rgb(255, 180, 189)',
}

export const jsonInput = 'input[accept="application/json,.json"]'

export function verifyValidImportInputExists() {
  cy.get(jsonInput).should('exist')
}

export function verifyImportDialogVisible() {
  cy.get(importDialog).should('be.visible').find(jsonInput).should('exist')
}

export function verifyUploadErrorMessage(msg) {
  cy.contains(msg)
}
export function verifyErrorOnUpload() {
  main.checkElementBackgroundColor(fileUploadSection, colors.pink)
}
export function verifyImportMessages() {
  main.checkTextsExistWithinElement(importDialog, importMessages)
}

// Reads through cy.fixture so the upload comes from the configured fixtures folder.
export function dragAndDropFile(file) {
  cy.fixture(file.replace(/^cypress\/fixtures\//, ''), null).as('uploadFile')
  cy.get(jsonInput).selectFile('@uploadFile', { action: 'drag-drop', force: true })
}
export function verifyImportBtnIsVisible() {
  cy.get(dialogImportBtn).scrollIntoView().should('be.visible')
}

export function verifyImportBtnStatus(status) {
  main.verifyElementsStatus([dialogImportBtn], status)
}

export function clickOnImportBtn() {
  verifyImportBtnIsVisible()
  cy.get(dialogImportBtn).last().scrollIntoView().click()
}

export function clickOnCancelBtn() {
  cy.get(dialogCancelBtn).last().scrollIntoView().click()
  main.verifyElementsCount(dialogImportBtn, 0)
}

export function clickOnImportBtnDataImportModal() {
  cy.contains('button', 'Import').click()
}

export function clickOnOpenSafeListSidebar() {
  cy.contains('My Safe accounts').click()
}

export function clickOnAddressBookBtn() {
  cy.contains(addressBookBtnStr).click()
}

export function verifyImportedAddressBookData() {
  //Verifies imported owners in the Address book for file ../fixtures/data_import.json
  cy.get('tbody tr:nth-child(1) td:nth-child(1)').contains(constants.SEPOLIA_CSV_ENTRY.name)
  cy.get('tbody tr:nth-child(1) td:nth-child(2)').contains(constants.SEPOLIA_CSV_ENTRY.address.substring(4))
}

export function clickOnAppsBtn() {
  cy.get('aside').contains('li', appsBtnStr).click()
}

export function clickOnBookmarkedAppsBtn() {
  cy.contains(bookmarkedAppsBtnStr).click()
  //Takes a some time to load the apps page, It waits for bookmark to be lighted up
  cy.waitForSelector(() => {
    return cy
      .get('[aria-selected="true"] p')
      .invoke('html')
      .then((text) => text === 'Bookmarked apps')
  })
}

export function verifyAppsAreVisible(appNames) {
  appNames.forEach((appName) => {
    cy.contains(appName).should('be.visible')
  })
}

export function verifyPinnedApps(pinnedApps) {
  cy.contains('h2', pinnedAppsStr).should('be.visible')
  pinnedApps.forEach((appName) => {
    cy.get('li').contains(appName).should('be.visible')
  })
}

export function clickOnSettingsBtn() {
  cy.contains(settingsBtnStr).click()
}

export function clickOnShowMoreTabsBtn() {
  cy.get(showMoreTabsBtn).click()
}

export function verifDataTabBtnIsVisible() {
  cy.contains(tab, dataTabStr).should('be.visible')
}
