/**
 * Regression — a Safe on an unsupported singleton shows the matching warning in the dashboard's "Action required" panel.
 *
 * The warning depends on the CGW `implementationVersionState` and on a comparison of the singleton's bytecode
 * with the official deployments. The jest tests mock both; this spec runs them against a real backend and chain.
 *
 * Run: yarn workspace @safe-global/web pw:test dashboard-mastercopy-warning
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'

const UNSUPPORTED_VERSION = 'This Safe is running an unsupported version'

test.describe('Dashboard mastercopy warning', { tag: '@regression' }, () => {
  test('should warn about an unsupported mastercopy and open the migration when the Safe can migrate', async ({
    safePage,
    safes,
  }) => {
    const home = new HomePage(safePage)
    await home.goto(safes.MATIC_MIGRATABLE_SAFE)
    await home.expandActionRequired()

    await expect(home.actionRequiredPanel).toContainText(UNSUPPORTED_VERSION)
    await expect(home.actionRequiredPanel).toContainText('You should migrate it to a compatible version')

    await home.migrateMastercopyButton.click()

    await expect(safePage.getByText('Update Safe account base contract')).toBeVisible()
  })

  test('should point to the CLI when the Safe runs an unofficial singleton', async ({ safePage, safes }) => {
    const home = new HomePage(safePage)
    await home.goto(safes.MATIC_UNOFFICIAL_SINGLETON_SAFE)
    await home.expandActionRequired()

    await expect(home.actionRequiredPanel).toContainText(UNSUPPORTED_VERSION)
    await expect(home.actionRequiredPanel).toContainText('You must use our CLI tool to migrate')
    await expect(home.getCliLink).toBeVisible()
  })
})
