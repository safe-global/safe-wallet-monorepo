import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as shield from '../pages/safe_shield.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signerAddress = walletCredentials.OWNER_4_WALLET_ADDRESS

let staticSafes = []

describe('Safe Shield tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  // ========================================
  // 1. Widget General
  // ========================================

  it.only('[Widget General] Verify that Safe Shield empty state is shown on New Transaction start before scanning', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_30)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    shield.verifySafeShieldDisplayed()
    shield.verifyEmptyState()
    shield.verifySecuredByFooter()
  })

  // ========================================
  // 2. Recipient Analyse
  // ========================================

  // TODO: Add Recipient Analyse tests

  // ========================================
  // 3. Threat Analyse
  // ========================================

  // TODO: Add Threat Analyse tests

  // ========================================
  // 4. Contract Analyse
  // ========================================

  // TODO: Add Contract Analyse tests

  // ========================================
  // 5. Tenderly Simulation
  // ========================================

  // TODO: Add Tenderly Simulation tests
})
