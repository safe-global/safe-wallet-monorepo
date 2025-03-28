import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as safeapps from '../pages/safeapps.pages'
import * as createTx from '../pages/create_tx.pages'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const txData = ['14', 'Send', '-0.00002 ETH', '1 out of 1']
const txaddOwner = ['5', 'addOwnerWithThreshold', '1 out of 2']
const txMultiSendCall3 = ['4', 'Batch', '3 actions', '1 out of 2']
const txMultiSendCall2 = ['6', 'Batch', '2 actions', '1 out of 2']

describe('Dashboard tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
  })

  it('Verify that pinned in dashboard, an app keeps its status on apps page', () => {
    dashboard.pinAppByIndex(0).then((pinnedApp) => {
      cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
      safeapps.verifyPinnedApp(pinnedApp)
      cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
      dashboard.clickOnPinBtnByName(pinnedApp)
      dashboard.verifyPinnedAppsCount(0)
    })
  })

  it('Verify clicking on View All button directs to list of all queued txs', () => {
    dashboard.clickOnViewAllBtn()
    createTx.verifyNumberOfTransactions(2)
  })

  it('Verify clicking on any tx takes the user to Transactions > Queue tab', () => {
    dashboard.clickOnTxByIndex(0)
    dashboard.verifySingleTxItem(txData)
  })

  it('Verify clicking on Explore Safe apps button opens list of all apps', () => {
    dashboard.clickOnExploreAppsBtn()
  })

  it('Verify there is empty tx string and image when there are no tx queued', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_13)
    dashboard.verifyEmptyTxSection()
  })

  it('[SMOKE] Verify that the last created tx in conflicting tx is showed in the widget', () => {
    cy.get(dashboard.pendingTxWidget, { timeout: 30000 }).should('be.visible')
    main.verifyElementsCount(dashboard.pendingTxItem, 1)
    dashboard.verifyDataInPendingTx(txData)
  })

  it('[SMOKE] Verify that tx are displayed correctly in Pending tx section', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_12)
    cy.wait(1000)
    dashboard.verifyTxItemInPendingTx(txMultiSendCall3)
    dashboard.verifyTxItemInPendingTx(txaddOwner)
    dashboard.verifyTxItemInPendingTx(txMultiSendCall2)
  })
})
