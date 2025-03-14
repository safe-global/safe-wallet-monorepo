import 'cypress-file-upload'
import * as constants from '../../support/constants'
import * as safe from '../pages/load_safe.pages'
import * as createwallet from '../pages/create_wallet.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'

let staticSafes = []

const testSafeName = 'Test safe name'
const testOwnerName = 'Test Owner Name'

describe('[PROD] Load Safe tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.prodbaseUrl + constants.loadNewSafeSepoliaUrl)
    cy.contains(safe.addSafeStr, { timeout: 10000 })
    closeSecurityNotice()
    acceptCookies2()
  })

  it('Verify Safe and owner names are displayed in the Review step', () => {
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_4)
    safe.clickOnNextBtn()
    createwallet.typeOwnerName(testOwnerName, 0)
    safe.clickOnNextBtn()
    safe.verifyDataInReviewSection(testSafeName, testOwnerName)
    safe.clickOnAddBtn()
  })
})
