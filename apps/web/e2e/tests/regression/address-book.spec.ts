/**
 * Regression — a local address book contact survives reloads, names the signer it belongs to, and goes away on delete.
 *
 * The address book is browser state, so only a real browser proves that an edit is persisted and read back after a
 * reload, and that Settings → Setup reads the same store. OWNER_4 is the only owner of the Safe, so its contact
 * labels the signer row. No wallet is connected and no transaction is sent.
 *
 * Run: yarn workspace @safe-global/web pw:test address-book
 * Tag: @regression — runs under the chromium project, on demand, and on the isolated backend.
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/test.fixture'
import { AddressBookPage } from '../../src/pages/address-book.page'
import { OwnersPage } from '../../src/pages/owners.page'

const NAME = 'E2E Owner'
const RENAMED = 'E2E Owner renamed'

test.describe('Address book', { tag: '@regression' }, () => {
  test('should keep a contact across reloads, label the signer with it, and remove it on delete', async ({
    safePage,
    safes,
    credentials,
  }) => {
    const owner = new Wallet(credentials.OWNER_4_PRIVATE_KEY).address
    const addressBook = new AddressBookPage(safePage)

    await addressBook.goto(safes.SEP_OWNER_4_SAFE)
    await addressBook.addEntry({ name: NAME, address: owner })
    await expect(addressBook.row(NAME)).toBeVisible()

    await safePage.reload()
    await expect(addressBook.row(NAME)).toBeVisible()

    await addressBook.rename(NAME, RENAMED)
    await safePage.reload()
    await expect(addressBook.row(RENAMED)).toBeVisible()
    await expect(addressBook.row(NAME)).toHaveCount(0)

    const owners = new OwnersPage(safePage)
    await owners.goto(safes.SEP_OWNER_4_SAFE)
    await expect(owners.signerList).toContainText(RENAMED)

    await addressBook.goto(safes.SEP_OWNER_4_SAFE)
    await addressBook.remove(RENAMED)
    await expect(addressBook.emptyState).toBeVisible()
    await safePage.reload()
    await expect(addressBook.emptyState).toBeVisible()
  })
})
