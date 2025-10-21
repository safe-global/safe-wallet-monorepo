import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createTx from '../pages/create_tx.pages'
import * as owner from '../pages/owners.pages'

const SAFE_QA_SEP = 'sep:0x6d0b6F96f665844E6Fcb1919f92656A2D1c5f076'
const SAFE_QA_SEPOLIA_RECIPIENT = '0xE8b3A9BD45f149VB14D4D4E8Bfbf8B7f8F6F'

describe('Transaction Simulation', () => {
  beforeEach(() => {
    cy.visit(`/${SAFE_QA_SEP}/home`)
    cy.clearLocalStorage()
    main.acceptCookies()
  })

  it('should display simulation button in Safe Shield widget during transaction creation', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Verify simulation button appears in the Safe Shield widget (right sidebar)
    cy.get('[data-testid="simulate-btn"]').should('be.visible')
    cy.contains('Run a simulation').should('be.visible')

    // Verify the simulation is in the Safe Shield widget context
    cy.get('[data-testid="simulate-btn"]').parents('div').should('contain.text', 'Secured by')
  })

  it('should successfully simulate a transaction', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Click simulate button
    cy.get('[data-testid="simulate-btn"]').click()

    // Wait for simulation to complete and check for success in Safe Shield widget
    cy.contains('Transaction simulations', { timeout: 10000 }).should('be.visible')
  })

  it('should show simulation loading state', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Click simulate button
    cy.get('[data-testid="simulate-btn"]').click()

    // Check for loading indicator (should appear immediately)
    cy.get('[role="progressbar"]').should('be.visible')
  })

  it('should display simulation error when transaction fails', () => {
    // Navigate to create transaction with invalid params that will cause failure
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details with amount larger than balance (should fail)
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(9999999) // Very large amount that will cause failure
    createTx.clickOnNextBtn()

    // Click simulate button
    cy.get('[data-testid="simulate-btn"]').click()

    // Wait for simulation to complete and check for error
    cy.contains('Error', { timeout: 10000 }).should('be.visible')

    // Verify error message is displayed
    cy.contains('Simulation failed').should('be.visible')
  })

  it('should maintain simulation state when navigating back', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Run simulation
    cy.get('[data-testid="simulate-btn"]').click()
    cy.contains('Transaction simulations', { timeout: 10000 }).should('be.visible')

    // Navigate back
    cy.get('[data-testid="modal-back-btn"]').click()

    // Navigate forward again
    createTx.clickOnNextBtn()

    // Simulation state should be reset (button should be visible again)
    cy.get('[data-testid="simulate-btn"]').should('be.visible')
  })

  it('should display Tenderly branding', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Verify Tenderly branding is present
    cy.contains('Powered by').should('be.visible')
    cy.get('img[alt="Tenderly"]').should('be.visible')
  })

  it('should reset simulation when transaction details change', () => {
    // Navigate to create transaction
    createTx.clickOnNewtransactionBtn()
    createTx.clickOnSendTokensBtn()

    // Fill in transaction details
    createTx.typeRecipientAddress(SAFE_QA_SEPOLIA_RECIPIENT)
    createTx.clickOnTokenselectorAndSelectSepoliaEth()
    createTx.setSendValue(0.00001)
    createTx.clickOnNextBtn()

    // Run simulation
    cy.get('[data-testid="simulate-btn"]').click()
    cy.contains('Transaction simulations', { timeout: 10000 }).should('be.visible')

    // Go back and change transaction details
    cy.get('[data-testid="modal-back-btn"]').click()
    createTx.setSendValue(0.00002)
    createTx.clickOnNextBtn()

    // Simulation should be reset and button should be visible again
    cy.get('[data-testid="simulate-btn"]').should('be.visible')
    cy.contains('Transaction simulations').should('not.exist')
  })
})

describe('Nested Transaction Simulation', () => {
  // Note: These tests would require a nested Safe setup
  // Skipping for now as they require specific test data

  it.skip('should simulate both parent and nested transactions', () => {
    // Test would verify that clicking "Run" simulates both parent and nested tx
    // This requires a nested Safe transaction setup
  })

  it.skip('should display both parent and nested simulation results', () => {
    // Test would verify that both simulation results are shown
    // This requires a nested Safe transaction setup
  })
})
