import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY

const txData = ['Send', '-0.00002 ETH', '1/1']
const txaddOwner = ['addOwnerWithThreshold', '1/2']
const txMultiSendCall3 = ['Batch', '3 actions', '1/2']
const txMultiSendCall2 = ['Batch', '2 actions', '1/2']

describe.skip('[SMOKE] Dashboard tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    wallet.ensureSiweSession(signer)
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[SMOKE] Verify the overview widget is displayed', () => {
    dashboard.verifyOverviewWidgetData()
  })

  it('[SMOKE] Verify the transaction queue widget is displayed', () => {
    dashboard.verifyTxQueueWidget()
  })

  it('[SMOKE] Verify the Safe Apps Section is displayed', () => {
    dashboard.verifyExplorePossibleSection()
  })

  // mock — intercept must be set up before visit so the mock catches the parallel queue request
  it('[SMOKE] Verify that the last created tx in conflicting tx is showed in the widget', () => {
    cy.fixture('pending_tx/pending_tx.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
    cy.get(dashboard.pendingTxWidget, { timeout: 30000 }).should('be.visible')
    main.verifyElementsCount(dashboard.pendingTxItem, 1)
    dashboard.verifyDataInPendingTx(txData)
  })

  // mock — intercept must be set up before visit so the mock catches the parallel queue request
  it('[SMOKE] Verify that tx are displayed correctly in Pending tx section', () => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
    })
    cy.wait('@getQueuedTransactions')
    dashboard.verifyTxItemInPendingTx(txMultiSendCall3)
    dashboard.verifyTxItemInPendingTx(txaddOwner)
    dashboard.verifyTxItemInPendingTx(txMultiSendCall2)
  })
})
