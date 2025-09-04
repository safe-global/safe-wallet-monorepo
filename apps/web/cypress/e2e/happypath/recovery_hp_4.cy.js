import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as recovery from '../pages/recovery.pages.js'
import * as tx from '../pages/transactions.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let recoverySafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

describe('Recovery happy path tests 4', () => {
  before(async () => {
    recoverySafes = await getSafes(CATEGORIES.recovery)
  })

  beforeEach(() => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_5)
    cy.clearLocalStorage()
    main.acceptCookies()
  })

  // Check that recovery can be setup and removed from modules
  it('Recovery setup happy path 4', () => {
    wallet.connectSigner(signer)
    owner.waitForConnectionStatus()
    recovery.clearRecoverers()
    recovery.clickOnSetupRecoveryBtn()
    recovery.clickOnNextBtn()
    recovery.enterRecovererAddress(constants.SEPOLIA_OWNER_2)
    recovery.agreeToTerms()
    recovery.clickOnNextBtn()
    tx.executeFlow_1()
    recovery.verifyRecovererAdded([constants.SEPOLIA_OWNER_2_SHORT])
    cy.visit(constants.modulesUrl + recoverySafes.SEP_RECOVERY_SAFE_5)
    recovery.deleteRecoveryModule()
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_5)
    recovery.getSetupRecoveryBtn()
  })
})
