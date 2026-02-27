import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as createTx from '../pages/create_tx.pages'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const txData = ['Send', 'Execution needed']
const txaddOwner = ['Add', 'new owner', '1 signature needed']
const txMultiSendCall3 = ['multiSend', '1 signature needed']
const txMultiSendCall2 = ['multiSend', '1 signature needed']
const txDataDetailsPage = ['Send', '1/1']

describe('Dashboard tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  // intercept must be set up before visit so it catches the parallel queue request
  beforeEach(() => {
    wallet.ensureSiweSession(signer)
    cy.intercept('GET', constants.queuedEndpoint).as('getQueuedTransactions')
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    cy.wait('@getQueuedTransactions')
    dashboard.verifyPendingTxWidget()
  })

  it('Verify clicking on View All button directs to list of all queued txs', () => {
    dashboard.clickOnViewAllBtn()
    createTx.verifyNumberOfTransactions(2)
  })

  it('Verify clicking on any tx takes the user to transaction details page', () => {
    dashboard.clickOnTxByIndex(0)
    dashboard.verifySingleTxItem(txDataDetailsPage)
  })

  it('Verify there is empty tx string when there are no tx queued', () => {
    cy.intercept('GET', constants.queuedEndpoint).as('getQueuedTransactions')
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_14)
    cy.wait('@getQueuedTransactions')
    dashboard.verifyEmptyTxSection()
  })

  it('[SMOKE] Verify that the last created tx in conflicting tx is showed in the widget', () => {
    cy.get(dashboard.pendingTxWidget, { timeout: 30000 }).should('be.visible')
    main.verifyElementsCount(dashboard.pendingTxItem, 1)
    dashboard.verifyDataInPendingTx(txData)
  })

  it('[SMOKE] Verify that tx are displayed correctly in Pending tx section', () => {
    cy.intercept('GET', constants.queuedEndpoint).as('getQueuedTransactions')
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_12)
    cy.wait('@getQueuedTransactions')
    dashboard.verifyTxItemInPendingTx(txMultiSendCall3)
    dashboard.verifyTxItemInPendingTx(txaddOwner)
    dashboard.verifyTxItemInPendingTx(txMultiSendCall2)
  })
})
