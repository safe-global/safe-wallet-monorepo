import { test, expect } from '../../fixtures/base.fixture'
import { mockRoute } from '../../fixtures/api-mock.fixture'
import { DashboardPage } from '../../pages/dashboard.page'
import { staticSafes } from '../../data/safes'
import * as constants from '../../data/constants'
import pendingTxData from '../../data/mocks/pending_tx/pending_tx.json' with { type: 'json' }
import pendingTxOrderData from '../../data/mocks/pending_tx/pending_tx_order.json' with { type: 'json' }

test.describe('[SMOKE] Dashboard tests', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ safePage }) => {
    dashboard = new DashboardPage(safePage)
  })

  test.describe('Real data', () => {
    test.beforeEach(async () => {
      await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2, {
        readySelector: dashboard.assetsWidget,
      })
    })

    test('Verify the overview widget is displayed', async () => {
      await dashboard.verifyOverviewWidgetData()
    })

    test('Verify the transaction queue widget is displayed', async () => {
      await dashboard.verifyTxQueueWidget()
    })

    test('Verify the Safe Apps Section is displayed', async () => {
      await dashboard.verifyExplorePossibleSection()
    })
  })

  test.describe('Mocked data', () => {
    test('Verify that the last created tx in conflicting tx is showed in the widget', async ({ safePage }) => {
      await mockRoute(safePage, '**/queued*', pendingTxData)
      await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2, {
        readySelector: dashboard.pendingTxWidget,
      })

      await dashboard.verifyElementsCount('[data-testid="tx-pending-item"]', 1)
      await dashboard.verifyDataInPendingTx(['Send', '-0.00002 ETH', '1/1'])
    })

    test('Verify that tx are displayed correctly in Pending tx section', async ({ safePage }) => {
      await mockRoute(safePage, '**/queued*', pendingTxOrderData)
      await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2, {
        readySelector: dashboard.pendingTxWidget,
      })

      await dashboard.verifyTxItemInPendingTx(['Batch', '3 actions', '1/2'])
      await dashboard.verifyTxItemInPendingTx(['addOwnerWithThreshold', '1/2'])
      await dashboard.verifyTxItemInPendingTx(['Batch', '2 actions', '1/2'])
    })
  })
})
