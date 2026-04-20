import { test, expect, connectSigner } from '../../fixtures/wallet.fixture'
import { OwnersPage } from '../../pages/owners.page'
import { staticSafes } from '../../data/safes'
import * as constants from '../../data/constants'

test.describe('[SMOKE] Replace Owners tests', () => {
  let owners: OwnersPage

  test.beforeEach(async ({ safePage }) => {
    owners = new OwnersPage(safePage)
  })

  test('Verify that "Replace" icon is visible', async ({ safePage, walletCredentials }) => {
    await owners.goto(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4, {
      readySelector: owners.safeAccountNonce,
    })
    await connectSigner(safePage, walletCredentials.OWNER_4_PRIVATE_KEY)

    await expect(owners.replaceOwnerBtnFirst).toBeVisible()
    await expect(owners.replaceOwnerBtnFirst).toBeEnabled()
  })

  test('Verify that replace button is disabled for non-owner', async () => {
    await owners.goto(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3, {
      readySelector: owners.safeAccountNonce,
    })

    await expect(owners.replaceOwnerBtnFirst).toBeVisible()
    await expect(owners.replaceOwnerBtnFirst).toBeDisabled()
  })

  test('Verify that the owner replacement form is opened', async ({ safePage, walletCredentials }) => {
    await owners.goto(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_4, {
      readySelector: owners.safeAccountNonce,
    })
    await connectSigner(safePage, walletCredentials.OWNER_4_PRIVATE_KEY)
    await expect(owners.accountCenter).toBeVisible({ timeout: 30_000 })

    await owners.openReplaceOwnerWindow(0)

    await expect(owners.newOwnerName).toBeVisible()
    await expect(owners.newOwnerAddress).toBeVisible()
  })
})
