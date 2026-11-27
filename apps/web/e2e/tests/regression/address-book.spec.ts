/**
 * Regression — a local address book contact survives reloads, names the signer it belongs to, and goes away on delete.
 *
 * The address book is browser state, so only a real browser proves that an edit is persisted and read back after a
 * reload, and that Settings → Setup reads the same store. Alice is the only owner of the Safe, so its contact
 * labels the signer row. No wallet is connected and no transaction is sent.
 *
 * Run: SAFE_E2E_SPECS=address-book yarn workspace @safe-global/web e2e:env playwright
 * Tag: @regression — runs under the chromium project, on demand, and on the isolated backend.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { AddressBookPage } from '../../src/pages/address-book.page'
import { OwnersPage } from '../../src/pages/owners.page'

const NAME = 'E2E Owner'
const RENAMED = 'E2E Owner renamed'

test.describe('Address book', { tag: '@regression' }, () => {
  test('should keep a contact across reloads, label the signer with it, and remove it on delete', async ({
    safePage,
    safes,
    owners,
  }) => {
    const owner = owners.alice.address
    const addressBook = new AddressBookPage(safePage)

    await addressBook.goto(safes.transferForm)
    await addressBook.addEntry({ name: NAME, address: owner })
    await expect(addressBook.row(NAME)).toBeVisible()

    await safePage.reload()
    await expect(addressBook.row(NAME)).toBeVisible()

    await addressBook.rename(NAME, RENAMED)
    await safePage.reload()
    await expect(addressBook.row(RENAMED)).toBeVisible()
    await expect(addressBook.row(NAME)).toHaveCount(0)

    const ownersPage = new OwnersPage(safePage)
    await ownersPage.goto(safes.transferForm)
    await expect(ownersPage.signerList).toContainText(RENAMED)

    await addressBook.goto(safes.transferForm)
    await addressBook.remove(RENAMED)
    await expect(addressBook.emptyState).toBeVisible()
    await safePage.reload()
    await expect(addressBook.emptyState).toBeVisible()
  })
})
