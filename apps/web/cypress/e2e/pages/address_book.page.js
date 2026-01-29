import * as constants from '../../support/constants.js'
import * as main from './main.page.js'
import staticSafes from '../../fixtures/safes/static.js'

// Re-export common selectors from main.page.js for backward compatibility
export const tableContainer = main.tableContainer
export const tableRow = main.tableRow

export const addressBookRecipient = '[data-testid="address-book-recipient"]'
const beameriFrameContainer = '#beamerOverlay .iframeCointaner'
const beamerInput = 'input[id="beamer"]'
const exportModalBtn = '[data-testid="export-modal-btn"]'
export const editEntryBtn = 'button[aria-label="Edit entry"]'
export const deleteEntryBtn = 'button[aria-label="Delete entry"]'
export const deleteEntryModalBtnSection = '.MuiDialogActions-root'
const importBtn = '[data-testid="import-btn"]'
const uploadErrorMsg = '[data-testid="error-message"]'
const modalSummaryMessage = '[data-testid="summary-message"]'
const saveBtn = '[data-testid="save-btn"]'
const divInput = '[data-testid="name-input"]'
const exportSummary = '[data-testid="export-summary"]'
const sendBtn = '[data-testid="send-btn"]'
export const entryDialog = '[data-testid="entry-dialog"]'

//TODO Move to specific component
const moreActionIcon = '[data-testid="MoreHorizIcon"]'

export const acceptSelection = main.acceptSelectionStr
export const addressBook = 'Address book'
const createEntryBtn = 'New entry'
export const delteEntryModaldeleteBtn = 'Delete'
const exportBtn = 'Export'
// const saveBtn = 'Save'
const whatsNewBtnStr = "What's new"
const beamrCookiesStr = 'accept the "Beamer" cookies'
const headerImportBtnStr = 'Import'
const mandatoryNameStr = 'Name *'
const nameSortBtn = 'Name'
const addressortBtn = 'Address'
const addToAddressBookStr = 'Add to address book'

export const emptyCSVFile = '../fixtures/address_book_empty_test.csv'
export const nonCSVFile = '../fixtures/balances.json'
export const duplicatedCSVFile = 'address_book_duplicated.csv'
export const validCSVFile = '../fixtures/address_book_test.csv'
export const networksCSVFile = '../fixtures/address_book_networks.csv'
export const addedSafesCSVFile = '../fixtures/address_book_addedsafes.csv'

const sortSafe1 = 'AA Safe'
const sortSafe2 = 'BB Safe'

export const entries = [
  '0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7',
  'test-sepolia-3',
  '0xf405BC611F4a4c89CCB3E4d083099f9C36D966f8',
  'sepolia-test-4',
  '0x03042B890b99552b60A073F808100517fb148F60',
  'sepolia-test-5',
  '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
  'assets-test-sepolia',
]

export function clickOnNextPageBtn() {
  cy.get(main.nextPageBtn).click()
}

export function clickOnPrevPageBtn() {
  cy.get(main.previousPageBtn).click()
}

export function verifyCountOfSafes(count) {
  main.verifyElementsCount(tableRow, count)
}
export function verifyRecipientData(data) {
  main.verifyValuesExist(addressBookRecipient, data)
}

export function clickOnSendBtn() {
  cy.get(sendBtn).click()
}

export function clickOnMoreActionsBtn() {
  cy.get(moreActionIcon).click()
}

export function clickOnAddToAddressBookBtn() {
  cy.get('li span').contains(addToAddressBookStr).click()
}

export function verifyExportMessage(count) {
  let msg = `${count} address book`
  cy.get(exportSummary).should('contain', msg)
}

export function clickOnNameSortBtn() {
  cy.get(tableContainer).contains(nameSortBtn).click()
  cy.wait(500)
}

export function clickOnAddrressSortBtn() {
  cy.get(tableContainer).contains(addressortBtn).click()
  cy.wait(500)
}

export function verifyEntriesOrder(option = 'ascending') {
  let address = constants.DEFAULT_OWNER_ADDRESS
  let name = sortSafe1
  if (option == 'descending') {
    address = constants.RECIPIENT_ADDRESS
    name = sortSafe2
  }

  cy.get(tableRow).eq(0).contains(address)
  cy.get(tableRow).eq(0).contains(name)
}

export function addEntryByENS(name, ens) {
  typeInName(name)
  typeInAddress(ens)
  clickOnSaveEntryBtn()
  verifyNewEntryAdded(name, staticSafes.SEP_STATIC_SAFE_6)
}

export function verifyModalSummaryMessage(entryCount, chainCount) {
  cy.get(modalSummaryMessage).should(
    'contain',
    `Found ${entryCount} entries on ${chainCount} ${chainCount > 1 ? 'chains' : 'chain'}`,
  )
}
export const uploadErrorMessages = {
  fileType: 'File type must be text/csv',
  emptyFile: 'No entries found in address book',
}

export function verifyUploadExportMessage(msg) {
  main.verifyValuesExist(uploadErrorMsg, msg)
}

export function verifyImportBtnStatus(status) {
  main.verifyElementsStatus([importBtn], status)
}

export function verifyNumberOfRows(number) {
  main.verifyElementsCount(tableRow, number)
}

export function clickOnImportFileBtn() {
  cy.contains(headerImportBtnStr).click()
}

export function importCSVFile(file) {
  cy.get('[type="file"]').selectFile(`cypress/fixtures/${file}`, { force: true })
}

export function clickOnImportBtn() {
  cy.get(importBtn).click()
}

export function verifyDataImported(data) {
  main.verifyValuesExist(tableContainer, data)
}

export function clickOnExportFileBtn() {
  cy.contains(exportBtn).should('be.enabled').click()
}

export function confirmExport() {
  cy.get(exportModalBtn).click()
}

export function clickOnCreateEntryBtn() {
  cy.contains(createEntryBtn).click()
}

export function typeInName(name) {
  cy.get(main.nameInput).type(name)
}

export function typeInAddress(address) {
  cy.get(main.addressInput).type(address)
}

export function clickOnSaveEntryBtn() {
  cy.get(saveBtn).click()
}

export function verifyNewEntryAdded(name, address) {
  cy.contains(name).should('exist')
  cy.contains(address).should('exist')
}

export function addEntry(name, address) {
  typeInName(name)
  typeInAddress(address)
  clickOnSaveEntryBtn()
  verifyNewEntryAdded(name, address)
}

export function clickOnEditEntryBtn() {
  cy.get(editEntryBtn).click({ force: true })
}

export function typeInNameInput(name) {
  cy.get(main.nameInput).clear().type(name).should('have.value', name)
}

export function verifyNameWasChanged(name, editedName) {
  cy.get(name).should('not.exist')
  cy.contains(editedName).should('exist')
}

export function clickDeleteEntryButton() {
  cy.get(deleteEntryBtn).click({ force: true })
}

export function clickDeleteEntryModalDeleteButton() {
  cy.get(deleteEntryModalBtnSection).contains(delteEntryModaldeleteBtn).click()
}

export function verifyEditedNameNotExists(name) {
  cy.get(name).should('not.exist')
}

export function clickOnWhatsNewBtn(force = false) {
  cy.contains(whatsNewBtnStr).click({ force })
}

export function acceptBeamerCookies() {
  cy.contains(beamrCookiesStr)
}

export function verifyBeamerIsChecked() {
  cy.get(beamerInput).should('be.checked')
}

export function verifyBeameriFrameExists() {
  cy.wait(1000)
  cy.get(beameriFrameContainer).should('exist')
}

export function verifyEmptyOwnerNameNotAllowed() {
  cy.get(main.nameInput).clear()
  main.verifyElementsStatus([saveBtn], constants.enabledStates.disabled)
  cy.get(divInput).contains(mandatoryNameStr)
}
