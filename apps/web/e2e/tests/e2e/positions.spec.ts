/**
 * Assets › Positions shows every DeFi position that Zerion reports for a Safe: one section per app, one table per
 * position group, one row per position with its token and type. A loan counts against the app.
 *
 * Runs only on the isolated stack, where the gateway calls a local Zerion (infra/mocks/zerion-api.ts). The scenario
 * registers positions modelled on a staging Safe: one group with two position types, two groups with one name, a
 * deposit with a loan against it, and a two-token pool. The expectations come from the gateway's portfolio, so the
 * test checks that every position reaches the page.
 */
import type { AppPosition } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { test, expect } from '../../src/fixtures/test.fixture'
import { SafeApiClient } from '../../src/api/safe-api-client'
import { AssetsPage } from '../../src/pages/assets.page'
import { PositionsPage } from '../../src/pages/positions.page'
import { CHAIN_IDS, safeAddress } from '../../src/data/constants'

/** The label of each position type that the scenario uses — what getReadablePositionType shows */
const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposited',
  loan: 'Debt',
  locked: 'Locked',
  staked: 'Staking',
  reward: 'Reward',
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function typeLabel({ type }: AppPosition): string {
  const label = TYPE_LABELS[type]
  if (!label) throw new Error(`Add the label of position type "${type}" to TYPE_LABELS`)
  return label
}

test.describe('DeFi positions', { tag: '@e2e' }, () => {
  test('should list every app, position group and position that Zerion reports, from the assets page', async ({
    safePage,
    safes,
  }) => {
    const portfolio = await new SafeApiClient(CHAIN_IDS.ethereum).getPortfolio(
      safeAddress(safes.ETH_ZERION_POSITIONS_SAFE),
    )
    const apps = portfolio.positionBalances
    // Precondition: the scenario's positions reached the gateway, a loan among them.
    expect(apps.length, `Zerion lists no position for ${safes.ETH_ZERION_POSITIONS_SAFE}`).toBeGreaterThan(0)
    const loans = apps
      .flatMap(({ groups }) => groups.flatMap(({ items }) => items))
      .filter(({ type }) => type === 'loan')
    expect(loans.length, 'the scenario has no loan').toBeGreaterThan(0)
    for (const loan of loans) expect(Number(loan.balanceFiat), 'the gateway counts a loan as negative').toBeLessThan(0)

    await new AssetsPage(safePage).goto(safes.ETH_ZERION_POSITIONS_SAFE)
    const positions = new PositionsPage(safePage)
    await positions.positionsTab.click()

    await expect(safePage).toHaveURL(/\/balances\/positions\?/)
    await expect(positions.totalValue).toBeVisible()
    await expect(positions.appSections).toHaveCount(apps.length)
    for (const app of apps) {
      const section = positions.appSection(app.appInfo.name)
      await expect(positions.groups(section)).toHaveCount(app.groups.length)

      for (const [groupIndex, group] of app.groups.entries()) {
        const table = positions.groups(section).nth(groupIndex)
        await expect(positions.groupTitle(table)).toHaveText(group.name)
        await expect(positions.positionRows(table)).toHaveCount(group.items.length)

        for (const [rowIndex, item] of group.items.entries()) {
          const row = positions.positionRows(table).nth(rowIndex)
          const { name, symbol } = item.tokenInfo
          await expect(row).toContainText(name)
          await expect(row).toContainText(new RegExp(`${escape(symbol)}\\s*•\\s*${typeLabel(item)}`))
          if (item.type === 'loan') await expect(row).toContainText(/-\s?\$/)
        }
      }
    }
  })
})
