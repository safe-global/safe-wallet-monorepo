import { test, expect } from '../../src/fixtures/test.fixture'
import { ROUTES } from '../../src/data/constants'

test.describe('Landing', { tag: ['@smoke', '@migration'] }, () => {
  test('should redirect a first-time visitor from the root URL to the welcome page', async ({ safePage }) => {
    await safePage.goto('/')

    await expect(safePage).toHaveURL(new RegExp(`(${ROUTES.welcomeSpaces}|${ROUTES.welcomeAccounts})$`))
    await expect(safePage).toHaveTitle(/Workspaces|My accounts/)
  })
})
