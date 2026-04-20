import { test, expect } from '../../fixtures/base.fixture'
import { BasePage } from '../../pages/main.page'
import * as constants from '../../data/constants'

test.describe('[SMOKE] Landing page tests', () => {
  test('Verify a user will be redirected to welcome page', async ({ safePage }) => {
    const mainPage = new BasePage(safePage)
    await mainPage.goto('/')
    await expect(safePage).toHaveURL(new RegExp(constants.welcomeUrl))
  })
})
