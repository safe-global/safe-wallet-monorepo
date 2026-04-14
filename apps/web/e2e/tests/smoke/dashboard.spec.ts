import { test, expect } from '../../fixtures/base.fixture'
import { DashboardPage } from '../../pages/dashboard.page'
import { staticSafes } from '../../data/safes'
import * as constants from '../../data/constants'
import path from 'path'
import fs from 'fs'

test.describe('[SMOKE] Dashboard tests', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ safePage }) => {
    dashboard = new DashboardPage(safePage)
    await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)
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

  test('Verify that the last created tx in conflicting tx is showed in the widget', async ({ safePage }) => {
    // Mock — route must be set up before visit so the mock catches the parallel queue request
    const fixtureDir = path.join(__dirname, '..', '..', '..', 'cypress', 'fixtures', 'pending_tx')
    const mockData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'pending_tx.json'), 'utf-8'))

    await safePage.route('**/queued*', (route) => route.fulfill({ json: mockData }))
    await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)

    await expect(dashboard.pendingTxWidget).toBeVisible({ timeout: 30_000 })
    await dashboard.verifyElementsCount('[data-testid="tx-pending-item"]', 1)
    await dashboard.verifyDataInPendingTx(['Send', '-0.00002 ETH', '1/1'])
  })

  test('Verify that tx are displayed correctly in Pending tx section', async ({ safePage }) => {
    // Mock — route must be set up before visit so the mock catches the parallel queue request
    const fixtureDir = path.join(__dirname, '..', '..', '..', 'cypress', 'fixtures', 'pending_tx')
    const mockData = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'pending_tx_order.json'), 'utf-8'))

    await safePage.route('**/queued*', (route) => route.fulfill({ json: mockData }))
    await dashboard.goto(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_2)

    await dashboard.verifyTxItemInPendingTx(['Batch', '3 actions', '1/2'])
    await dashboard.verifyTxItemInPendingTx(['addOwnerWithThreshold', '1/2'])
    await dashboard.verifyTxItemInPendingTx(['Batch', '2 actions', '1/2'])
  })
})
