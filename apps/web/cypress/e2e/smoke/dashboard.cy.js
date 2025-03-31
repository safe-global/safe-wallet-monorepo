import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const txData = ['14', 'Send', '-0.00002 ETH', '1 out of 1']
const txaddOwner = ['5', 'addOwnerWithThreshold', '1 out of 2']
const txMultiSendCall3 = ['4', 'Batch', '3 actions', '1 out of 2']
const txMultiSendCall2 = ['6', 'Batch', '2 actions', '1 out of 2']

describe('[SMOKE] Dashboard tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('[SMOKE] Verify the overview widget is displayed', () => {
    dashboard.verifyOverviewWidgetData()
  })

  it('[SMOKE] Verify the transaction queue widget is displayed', () => {
    dashboard.verifyTxQueueWidget()
  })

  it('[SMOKE] Verify the Safe Apps Section is displayed', () => {
    dashboard.verifySafeAppsSection()
  })

  // mock
  it('[SMOKE] Verify that the last created tx in conflicting tx is showed in the widget', () => {
    cy.fixture('pending_tx/pending_tx.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
    })
    cy.wait('@getQueuedTransactions')
    cy.get(dashboard.pendingTxWidget, { timeout: 30000 }).should('be.visible')
    main.verifyElementsCount(dashboard.pendingTxItem, 1)
    dashboard.verifyDataInPendingTx(txData)
  })

  // mock
  it('[SMOKE] Verify that tx are displayed correctly in Pending tx section', () => {
    cy.fixture('pending_tx/pending_tx_order.json').then((mockData) => {
      cy.intercept('GET', constants.queuedEndpoint, mockData).as('getQueuedTransactions')
    })
    cy.wait('@getQueuedTransactions')
    dashboard.verifyTxItemInPendingTx(txMultiSendCall3)
    dashboard.verifyTxItemInPendingTx(txaddOwner)
    dashboard.verifyTxItemInPendingTx(txMultiSendCall2)
  })
})
