import { Wallet } from 'ethers'
import type { SpaceAddressBookDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
  let admin: EmailSession

  const addressBook = async (resource = 'address-book') =>
    (await workspaceResource(admin, workspaceId, resource)).toLowerCase()

  const contactTags = async (address: string): Promise<Set<string> | undefined> => {
    const book = (await gatewayRequest(admin, 'GET', `/v1/spaces/${workspaceId}/address-book`)) as SpaceAddressBookDto
    const contact = book.data.find((item) => item.address.toLowerCase() === address.toLowerCase())
    return contact && new Set(book.tags.filter(({ id }) => contact.tagIds.includes(id)).map(({ name }) => name))
  }

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
      expect(await contactTags(vendor.address)).toEqual(new Set(vendor.tags))
      expect(await contactTags(auditor.address)).toEqual(new Set())
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

    test('should let a member request a suggestion, and show only Export and Edit tags', async ({
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

    test('should save the tags a member sets on a Workspace contact', async ({ safePage }) => {
      const payroll = { name: 'Payroll', address: Wallet.createRandom().address, chainIds: [SEPOLIA], tags: ['Vendor'] }
      const supplier = { name: 'Supplier', address: Wallet.createRandom().address, chainIds: [SEPOLIA] }
      await gatewayRequest(admin, 'PUT', `/v1/spaces/${workspaceId}/address-book`, { items: [payroll, supplier] })
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.editTags(supplier.name, 'Vendor')

      await expect(page.row(supplier.name)).toContainText('Vendor')
      await expect.poll(() => contactTags(supplier.address)).toEqual(new Set(['Vendor']))
    })
  })
})
