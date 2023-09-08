import * as constants from '../../support/constants'

describe('Pending actions', () => {
  before(() => {
    cy.visit(`/welcome`)
    cy.contains('button', 'Accept selection').click()
  })

  beforeEach(() => {
    // Uses the previously saved local storage
    // to preserve the wallet connection between tests
    cy.restoreLocalStorageCache()
  })

  afterEach(() => {
    cy.saveLocalStorageCache()
  })

  it('should add the Safe with the pending actions', () => {
    // Enters Loading Safe form
    cy.contains('button', 'Add').click()
    cy.contains('Name, address & network')

    // Inputs the Safe address
    cy.get('input[name="address"]').type(constants.TEST_SAFE)
    cy.contains('Next').click()

    cy.contains('Owners and confirmations')
    cy.contains('Next').click()

    cy.contains('Add').click()
  })

  it('should display the pending actions in the Safe list sidebar', () => {
    cy.get('aside').within(() => {
      cy.get('[data-testid=ChevronRightIcon]').click({ force: true })
    })

    cy.get('li').within(() => {
      cy.contains('0x04f8...1a91').should('exist')

      //cy.get('img[alt="E2E Wallet logo"]').next().contains('2').should('exist')
      cy.get('[data-testid=CheckIcon]').next().contains('1').should('exist')

      // click on the pending actions
      cy.get('[data-testid=CheckIcon]').next().click()
    })
  })

  it('should have the right number of queued and signable transactions', () => {
    // Navigates to the tx queue
    cy.contains('h3', 'Transactions').should('be.visible')

    // contains 1 queued transaction
    cy.get('span:contains("1 out of 1")').should('have.length', 1)
  })
})
