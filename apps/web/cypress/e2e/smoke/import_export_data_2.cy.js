import 'cypress-file-upload'
import * as file from '../pages/import_export.pages.js'
import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Import Export Data tests 2', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_13)
  })

  it('[SMOKE] Verify the Import section is on the Global settings', () => {
    cy.visit(constants.dataSettingsUrl + staticSafes.SEP_STATIC_SAFE_13)
    file.verifyImportSectionVisible()
    file.verifyValidImportInputExists()
  })

  it('[SMOKE] Verify that the Export section is present in the safe settings', () => {
    cy.visit(constants.dataSettingsUrl + staticSafes.SEP_STATIC_SAFE_13)
    file.verifyExportFileSectionIsVisible()
  })
})
