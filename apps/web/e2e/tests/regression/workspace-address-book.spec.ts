import { Wallet } from 'ethers'
import type { AddressBookRequestsDto, SpaceAddressBookDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
  type EmailSession,
} from '../../src/fixtures/email-session'
import { seedLocalAddressBook } from '../../src/fixtures/seed-address-book'
import { WorkspaceAddressBookPage } from '../../src/pages/workspace-address-book.page'

const SEPOLIA = CHAIN_IDS.sepolia
const SAFE_NAME = 'Treasury'
const ALICE_SUGGESTION = `${SAFE_NAME} signer 1`

type CsvContact = { name: string; address: string; tags: string[] }

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

const toCsv = (contacts: CsvContact[]): string =>
  [
    'address,name,chainId,tags',
    ...contacts.map(({ address, name, tags }) => `${address},${name},${SEPOLIA},${tags.join(';')}`),
  ].join('\n')

test.describe('Workspace address book', { tag: '@regression' }, () => {
  let workspaceId: string
  let admin: EmailSession

  const findContact = async (address: string): Promise<{ name: string; tags: Set<string> } | undefined> => {
    const book = (await gatewayRequest(admin, 'GET', `/v1/spaces/${workspaceId}/address-book`)) as SpaceAddressBookDto
    const contact = book.data.find((item) => sameAddress(item.address, address))
    return (
      contact && {
        name: contact.name,
        tags: new Set(book.tags.filter(({ id }) => contact.tagIds.includes(id)).map(({ name }) => name)),
      }
    )
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

      await page.openTab('Suggested')
      await page.addSuggestion(ALICE_SUGGESTION)

      await page.openTab('Workspace contacts')
      await expect(page.row(ALICE_SUGGESTION)).toBeVisible()
      await expect.poll(async () => (await findContact(owners.alice.address))?.name).toBe(ALICE_SUGGESTION)
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
      expect((await findContact(vendor.address))?.tags).toEqual(new Set(vendor.tags))
      expect((await findContact(auditor.address))?.tags).toEqual(new Set())
    })

    test('should add a local contact to the Workspace address book', async ({ safePage }) => {
      const contact = { name: 'Local vendor', address: Wallet.createRandom().address }
      await seedLocalAddressBook(safePage, [contact])
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.openTab('Local contacts')
      await page.addLocalContactToWorkspace(contact.name)

      await page.openTab('Workspace contacts')
      await expect(page.row(contact.name)).toBeVisible()
      expect((await findContact(contact.address))?.name).toBe(contact.name)
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

    test('should let a member request a suggestion', async ({ safePage, safes, owners }) => {
      await addWorkspaceSafe(safeAddress(safes.basic))
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.openTab('Suggested')
      await page.requestToAdd(ALICE_SUGGESTION)

      await expect
        .poll(async () => {
          const requests = (await gatewayRequest(
            admin,
            'GET',
            `/v1/spaces/${workspaceId}/address-book/requests`,
          )) as AddressBookRequestsDto
          return requests.data.find((request) => sameAddress(request.address, owners.alice.address))?.name
        })
        .toBe(ALICE_SUGGESTION)
      await expect(page.row(ALICE_SUGGESTION)).toBeHidden()
    })

    test('should save the tags a member sets on a Workspace contact', async ({ safePage }) => {
      const payroll = { name: 'Payroll', address: Wallet.createRandom().address, chainIds: [SEPOLIA], tags: ['Vendor'] }
      const supplier = { name: 'Supplier', address: Wallet.createRandom().address, chainIds: [SEPOLIA] }
      await gatewayRequest(admin, 'PUT', `/v1/spaces/${workspaceId}/address-book`, { items: [payroll, supplier] })
      const page = new WorkspaceAddressBookPage(safePage)
      await page.goto(workspaceId)

      await page.addTag(supplier.name, 'Vendor')

      await expect(page.row(supplier.name)).toContainText('Vendor')
      await expect.poll(async () => (await findContact(supplier.address))?.tags).toEqual(new Set(['Vendor']))
    })
  })
})
