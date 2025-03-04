import 'cypress-file-upload'
import * as constants from '../../support/constants.js'
import * as addressBook from '../pages/address_book.page.js'
import * as main from '../pages/main.page.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const NAME = 'Owner1'
const NAME_2 = 'Owner2'
const EDITED_NAME = 'Edited Owner1'
const duplicateEntry = 'test-sepolia-90'
const owner1 = 'Automation owner'
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const recipientData = [owner1, constants.DEFAULT_OWNER_ADDRESS]

describe('Address book tests - 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.addressBookUrl + staticSafes.SEP_STATIC_SAFE_4)
  })

  it('Verify entry can be added', () => {
    addressBook.clickOnCreateEntryBtn()
    addressBook.addEntry(NAME, constants.RECIPIENT_ADDRESS)
  })

  it('Verify entry can be deleted', () => {
    cy.wrap(null)
      .then(() =>
        main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress1),
      )
      .then(() =>
        main.isItemInLocalstorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress1),
      )
      .then(() => {
        cy.reload()
        addressBook.clickDeleteEntryButton()
        addressBook.clickDeleteEntryModalDeleteButton()
        addressBook.verifyEditedNameNotExists(EDITED_NAME)
      })
  })

  it('Verify csv file can be imported', () => {
    addressBook.clickOnImportFileBtn()
    addressBook.importCSVFile(addressBook.validCSVFile)
    addressBook.verifyImportBtnStatus(constants.enabledStates.enabled)
    addressBook.clickOnImportBtn()
    addressBook.verifyDataImported(addressBook.entries)
    addressBook.verifyNumberOfRows(4)
  })

  it('Import a csv file with an empty address/name/network in one row', () => {
    addressBook.clickOnImportFileBtn()
    addressBook.importCSVFile(addressBook.emptyCSVFile)
    addressBook.verifyImportBtnStatus(constants.enabledStates.disabled)
    addressBook.verifyUploadExportMessage([addressBook.uploadErrorMessages.emptyFile])
  })

  it('Import a non-csv file', () => {
    addressBook.clickOnImportFileBtn()
    addressBook.importCSVFile(addressBook.nonCSVFile)
    addressBook.verifyImportBtnStatus(constants.enabledStates.disabled)
    addressBook.verifyUploadExportMessage([addressBook.uploadErrorMessages.fileType])
  })

  it('Import a csv file with a repeated address and same network', () => {
    addressBook.clickOnImportFileBtn()
    addressBook.importCSVFile(addressBook.duplicatedCSVFile)
    addressBook.verifyImportBtnStatus(constants.enabledStates.enabled)
    addressBook.clickOnImportBtn()
    addressBook.verifyDataImported([duplicateEntry])
    addressBook.verifyNumberOfRows(1)
  })

  it('Verify modal shows the amount of entries and networks detected', () => {
    addressBook.clickOnImportFileBtn()
    addressBook.importCSVFile(addressBook.networksCSVFile)
    addressBook.verifyImportBtnStatus(constants.enabledStates.enabled)
    addressBook.verifyModalSummaryMessage(4, 3)
  })

  it('Verify an entry can be added by ENS name', () => {
    addressBook.clickOnCreateEntryBtn()
    addressBook.addEntryByENS(NAME_2, constants.ENS_TEST_SEPOLIA)
  })

  it('Verify clicking on Send button autofills the recipient filed with correct value', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.sepoliaAddress2)
    cy.wait(1000)
    cy.reload()
    wallet.connectSigner(signer)
    addressBook.clickOnSendBtn()
    addressBook.verifyRecipientData(recipientData)
  })
})
