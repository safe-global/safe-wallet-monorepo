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

  beforeEach(() => {
    // MATIC_STATIC_SAFE_30 - dedicated for Safe Shield testing
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_30)

    // Setup addressBook
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, {
      137: {
        [shield.TEST_RECIPIENT]: 'Test Recipient',
        [shield.TEST_SAFE_ADDRESS]: 'Test Safe Address', // Safe contract address
        [signerAddress]: 'Test Signer (Owner 4)', // Add signer address to addressBook
      },
    })
    cy.wait(1000) // Wait for localStorage to be set
    cy.reload() // Reload to apply addressBook

    // Connect OWNER_4 wallet for each test
    wallet.connectSigner(signer)
    // main.waitForHistoryCallToComplete()
  })

  // ========================================
  // 1. Widget General
  // ========================================

  it.only('[Widget General] Verify that Safe Shield empty state is shown on New Transaction start before scanning', () => {
    // Start creating a new transaction
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()

    // Verify Safe Shield widget is displayed
    shield.verifySafeShieldDisplayed()

    // Verify empty state message before any scanning
    shield.verifyEmptyState()

    // Verify "Secured by" footer is present
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
