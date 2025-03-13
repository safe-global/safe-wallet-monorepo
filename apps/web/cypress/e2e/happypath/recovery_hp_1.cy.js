import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as owner from '../pages/owners.pages'
import * as recovery from '../pages/recovery.pages'
import * as tx from '../pages/transactions.page'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as createtx from '../pages/create_tx.pages.js'

let recoverySafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Recovery happy path tests 1', () => {
  before(async () => {
    recoverySafes = await getSafes(CATEGORIES.recovery)
  })

  beforeEach(() => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_1)
    cy.clearLocalStorage()
    main.acceptCookies()
  })

  // Check that recovery can be setup and removed
  it('Recovery setup happy path 1', () => {
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
    recovery.clearRecoverers()
    recovery.clickOnSetupRecoveryBtn()
    recovery.clickOnSetupRecoveryModalBtn()
    recovery.clickOnNextBtn()
    recovery.enterRecovererAddress(constants.SEPOLIA_OWNER_2)
    recovery.agreeToTerms()
    recovery.clickOnNextBtn()
    main.verifyElementsCount(createtx.noteTextField, 1)
    tx.executeFlow_1()
    recovery.verifyRecovererAdded([constants.SEPOLIA_OWNER_2_SHORT])
    recovery.clearRecoverers()
    recovery.getSetupRecoveryBtn()
  })
})
