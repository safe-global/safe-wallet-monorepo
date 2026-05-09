import * as constants from '../../support/constants'
import * as safe from '../pages/load_safe.pages'
import * as createwallet from '../pages/create_wallet.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const testSafeName = 'Test safe name'
const testOwnerName = 'Test Owner Name'

describe('Load Safe tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.loadNewSafeSepoliaUrl)
    cy.wait(2000)
  })

  it('Verify custom name in the first owner can be set', () => {
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_4)
    safe.clickOnNextBtn()
    createwallet.typeOwnerName(testOwnerName, 0)
    safe.clickOnNextBtn()
  })

  // Added to prod
  it('Verify Safe and owner names are displayed in the Review step', () => {
    safe.inputNameAndAddress(testSafeName, staticSafes.SEP_STATIC_SAFE_4)
    safe.clickOnNextBtn()
    createwallet.typeOwnerName(testOwnerName, 0)
    safe.clickOnNextBtn()
    safe.verifyDataInReviewSection(testSafeName, testOwnerName)
    safe.clickOnAddBtn()
  })
})
