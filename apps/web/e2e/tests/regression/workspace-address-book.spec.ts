/**
 * The v2 address book of a Workspace, against the gateway of the isolated stack.
 *
 * Every user signs in by email with a second factor, so no action asks for a step-up: step-up-workspace-actions.spec.ts
 * covers that. Each test gets its own Workspace; `safes.basic` (owner Alice, threshold 1) is only added to it.
 *
 * Run: SAFE_E2E_SPECS=workspace-address-book yarn workspace @safe-global/web e2e:env playwright
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/test.fixture'
import { CHAIN_IDS, safeAddress } from '../../src/data/constants'
import {
  acceptInvite,
  createEmailSession,
  createWorkspace,
  gatewayRequest,
  inviteMember,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
  type EmailSession,
} from '../../src/fixtures/email-session'
import { seedLocalAddressBook } from '../../src/fixtures/seed-address-book'
import { WorkspaceAddressBookPage } from '../../src/pages/workspace-address-book.page'

const SEPOLIA = CHAIN_IDS.sepolia
const SAFE_NAME = 'Treasury'
const ALICE_SUGGESTION = `${SAFE_NAME} signer 1`

type CsvContact = { name: string; address: string; tags: string[] }

const toCsv = (contacts: CsvContact[]): string =>
  [
    'address,name,chainId,tags',
    ...contacts.map(({ address, name, tags }) => `${address},${name},${SEPOLIA},${tags.join(';')}`),
  ].join('\n')

test.describe('Workspace address book', { tag: '@regression' }, () => {
  let workspaceId: string
  /** The admin who created the Workspace, for test data and for reading the gateway */
  let admin: EmailSession

  /** The gateway's Workspace address book, or another resource under it, lowercased to compare addresses */
  const addressBook = async (resource = 'address-book') =>
    (await workspaceResource(admin, workspaceId, resource)).toLowerCase()

  /** Adds the Safe to the Workspace, and names it in the Workspace address book */
  const addWorkspaceSafe = (address: string) =>
    gatewayRequest(admin, 'POST', `/v1/spaces/${workspaceId}/safes`, {
      safes: [{ chainId: SEPOLIA, address }],
      addressBookItems: [{ name: SAFE_NAME, address, chainIds: [SEPOLIA] }],
    })

  test.beforeEach(async () => {
    admin = await createEmailSession(uniqueEmail('address-book-admin'))
    workspaceId = (await createWorkspace(admin, 'Acme')).uuid
    // The default trial reaches the gateway late; a stored plan gives the Workspace its Safe seats now.
    await storeSubscription(admin, workspaceId)
  })

  test.describe('as an admin', () => {
    test.beforeEach(async ({ safePage }) => {
      await signInWithEmail(safePage, admin.email)
    })

    test('should add the signer of a Workspace Safe from the Suggested tab', async ({ safePage, safes, owners }) => {
      await addWorkspaceSafe(safeAddress(safes.basic))
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.tab('Suggested').click()
      await page.addSuggestion(ALICE_SUGGESTION)

      await expect(page.tab('Workspace contacts')).toHaveText('Workspace contacts (2)')
      await page.tab('Workspace contacts').click()
      await expect(page.row(ALICE_SUGGESTION)).toBeVisible()
      await expect.poll(() => addressBook()).toContain(owners.alice.address.toLowerCase())
      expect(await addressBook()).toContain(ALICE_SUGGESTION.toLowerCase())
    })

    test('should import the contacts and tags of a CSV file', async ({ safePage }) => {
      const vendor = { name: 'Payroll vendor', address: Wallet.createRandom().address, tags: ['Vendor', 'Monthly'] }
      const auditor = { name: 'Auditor', address: Wallet.createRandom().address, tags: [] }
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.importCsv(toCsv([vendor, auditor]))

      await expect(page.row(vendor.name)).toContainText('Vendor')
      await expect(page.row(vendor.name)).toContainText('Monthly')
      await expect(page.row(auditor.name)).toBeVisible()
      const saved = await addressBook()
      for (const text of [vendor.address, auditor.address, 'Vendor', 'Monthly']) {
        expect(saved).toContain(text.toLowerCase())
      }
    })

    test('should add a local contact to the Workspace address book', async ({ safePage }) => {
      const contact = { name: 'Local vendor', address: Wallet.createRandom().address }
      await seedLocalAddressBook(safePage, [contact])
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.tab('Local contacts').click()
      await page.addLocalContactToWorkspace(contact.name)

      await expect(page.tab('Workspace contacts')).toHaveText('Workspace contacts (1)')
      await page.tab('Workspace contacts').click()
      await expect(page.row(contact.name)).toBeVisible()
      expect(await addressBook()).toContain(contact.address.toLowerCase())
    })
  })

  test.describe('as a member', () => {
    const MEMBER_NAME = 'Member'

    test.beforeEach(async ({ safePage }) => {
      const email = uniqueEmail('address-book-member')
      await inviteMember(admin, workspaceId, { email, name: MEMBER_NAME })
      const member = await signInWithEmail(safePage, email)
      await acceptInvite(member, workspaceId, MEMBER_NAME)
    })

    test('should let a member request a suggestion and edit tags, but not add, import, edit or delete contacts', async ({
      safePage,
      safes,
      owners,
    }) => {
      await addWorkspaceSafe(safeAddress(safes.basic))
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.tab('Suggested').click()
      await page.requestToAdd(ALICE_SUGGESTION)

      await expect(page.row(ALICE_SUGGESTION)).toContainText('Requested')
      await expect.poll(() => addressBook('address-book/requests')).toContain(owners.alice.address.toLowerCase())

      await page.tab('Workspace contacts').click()
      await expect(page.exportButton).toBeVisible()
      await expect(page.addContactButton).toBeHidden()
      await expect(page.importButton).toBeHidden()
      await page.rowMenuButton(SAFE_NAME).click()
      await expect(page.menuItem('Edit tags')).toBeVisible()
      await expect(page.menuItem('Edit contact')).toBeHidden()
      await expect(page.menuItem('Delete contact')).toBeHidden()
    })
  })
})
