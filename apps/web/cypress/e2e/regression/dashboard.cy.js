import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import * as safeapps from '../pages/safeapps.pages'
import * as createTx from '../pages/create_tx.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

const txData = ['14', 'Send', '-0.00002 ETH', '1 out of 1']

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
})
