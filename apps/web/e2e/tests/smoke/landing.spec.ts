import { test, expect } from '../../fixtures/base.fixture'
import * as constants from '../../data/constants'

test.describe('[SMOKE] Landing page tests', () => {
  test('Verify a user will be redirected to welcome page', async ({ safePage }) => {
    await safePage.goto('/')
    await expect(safePage).toHaveURL(new RegExp(constants.welcomeUrl))
  })
})
