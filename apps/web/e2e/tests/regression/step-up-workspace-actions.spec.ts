// The user signs in without a second factor; the test data comes from a second session that has one.
import type { Browser, Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { CHAIN_IDS, TEST_ADDRESSES } from '../../src/data/constants'
import { isIsolated } from '../../src/fixtures/isolated-data'
import {
  createWorkspace,
  gatewayRequest,
  openEmailSession,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
} from '../../src/fixtures/email-session'
import { completeStepUp, expectActionReplayed } from '../../src/fixtures/step-up'

const SEPOLIA = CHAIN_IDS.sepolia
const CONTACT = { name: 'Treasury contact', address: TEST_ADDRESSES.NON_OWNER }

const prefixless = (prefixedAddress: string): string => prefixedAddress.split(':')[1]

test.describe('Step-up for the actions inside a Workspace', { tag: '@regression' }, () => {
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  let email: string
  let workspaceId: string
  /** The same user, signed in with a second factor, for test data. */
  let setup: Page

  const pageUrl = (path: string) => new RegExp(`${path}\\?spaceId=${workspaceId}$`)

  /** Invites a new user, who accepts; returns that member's own session, which the caller closes. */
  async function joinAsMember(browser: Browser, name: string): Promise<Page> {
    const memberEmail = uniqueEmail('member')
    await gatewayRequest(setup, 'POST', `/v1/spaces/${workspaceId}/members/invite`, {
      users: [{ type: 'email', email: memberEmail, role: 'MEMBER', name }],
    })
    const member = await openEmailSession(browser, memberEmail, { secondFactor: false })
    await gatewayRequest(member, 'POST', `/v1/spaces/${workspaceId}/members/accept`, { name })
    return member
  }

  test.beforeEach(async ({ safePage, browser }) => {
    email = uniqueEmail('step-up-actions')
    await signInWithEmail(safePage, email, { secondFactor: false })
    setup = await openEmailSession(browser, email)
    workspaceId = (await createWorkspace(setup, 'Step-up actions')).uuid
    // The default trial reaches the gateway late; a stored plan gives the Workspace its Safe seats now.
    await storeSubscription(workspaceId)
  })

  test.afterEach(async () => {
    await setup.context().close()
  })

  test('should add the Safe to the Workspace when the step-up succeeds', async ({ safePage, safes }) => {
    const address = prefixless(safes.SEP_STATIC_SAFE_1)
    await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Add accounts' }).click()
    await safePage.getByRole('button', { name: 'Select from my accounts' }).click()
    await safePage.getByRole('button', { name: 'Add manually' }).click()
    const addManually = safePage.getByRole('dialog').filter({ hasText: 'Add safe account' })
    await addManually.getByRole('combobox').click()
    await safePage.getByTestId('network-item').filter({ hasText: 'Sepolia' }).click()
    await addManually.getByRole('textbox', { name: 'Safe account' }).fill(address)
    await safePage.getByRole('button', { name: 'Add', exact: true }).click()
    await safePage.getByRole('dialog', { name: 'My accounts' }).getByRole('button', { name: 'Save' }).click()
    await safePage.getByRole('textbox', { name: 'Add a name' }).fill('Treasury Safe')
    await safePage.getByRole('button', { name: 'Save' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/safe-accounts'), 'Safe account added')
    await expect(safePage.getByRole('row').filter({ hasText: 'Treasury Safe' })).toBeVisible()
    expect(await workspaceResource(safePage, workspaceId, 'safes')).toContain(address)
  })

  test('should rename the Workspace Safe when the step-up succeeds', async ({ safePage, safes }) => {
    const address = prefixless(safes.SEP_STATIC_SAFE_1)
    await gatewayRequest(setup, 'POST', `/v1/spaces/${workspaceId}/safes`, {
      safes: [{ chainId: SEPOLIA, address }],
    })
    await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Safe Account actions' }).click()
    await safePage.getByRole('menuitem', { name: 'Rename' }).click()
    await safePage.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('Treasury Safe')
    await safePage.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/safe-accounts'), 'Address book updated')
    await expect(safePage.getByRole('row').filter({ hasText: 'Treasury Safe' })).toBeVisible()
    expect(await workspaceResource(safePage, workspaceId, 'address-book')).toContain('Treasury Safe')
  })

  test('should remove the Safe from the Workspace when the step-up succeeds', async ({ safePage, safes }) => {
    const address = prefixless(safes.SEP_STATIC_SAFE_1)
    await gatewayRequest(setup, 'POST', `/v1/spaces/${workspaceId}/safes`, {
      safes: [{ chainId: SEPOLIA, address }],
    })
    await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Safe Account actions' }).click()
    await safePage.getByRole('menuitem', { name: 'Remove from Workspace' }).click()
    await safePage.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/safe-accounts'), 'Safe account removed')
    await expect(safePage.getByRole('button', { name: 'Safe Account actions' })).toBeHidden()
    expect(await workspaceResource(safePage, workspaceId, 'safes')).not.toContain(address)
  })

  test('should invite the member when the step-up succeeds', async ({ safePage }) => {
    const invitee = uniqueEmail('invitee')
    await safePage.goto(`/spaces/members?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Add member' }).click()
    const dialog = safePage.getByRole('dialog')
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Invitee')
    await dialog.getByRole('combobox', { name: 'Address, email or ENS' }).fill(invitee)
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/members'), 'Invitation sent')
    await expect(safePage.getByRole('tab', { name: 'Pending (1)' })).toBeVisible()
    expect(await workspaceResource(safePage, workspaceId, 'members')).toContain(invitee)
  })

  test.describe('with a second active member', () => {
    const MEMBER_NAME = 'Second member'

    test.beforeEach(async ({ browser }) => {
      await (await joinAsMember(browser, MEMBER_NAME)).context().close()
    })

    const memberRow = (page: Page) => page.getByRole('row').filter({ hasText: MEMBER_NAME })

    test('should change the member role when the step-up succeeds', async ({ safePage }) => {
      await safePage.goto(`/spaces/members?spaceId=${workspaceId}`)

      await memberRow(safePage).getByRole('button', { name: 'Edit member' }).click()
      await safePage.getByRole('combobox', { name: 'Role' }).click()
      await safePage.getByRole('option', { name: 'Admin' }).click()
      await safePage.getByRole('button', { name: 'Update' }).click()
      await completeStepUp(safePage)

      await expectActionReplayed(safePage, pageUrl('/spaces/members'), 'Role updated')
      await expect(memberRow(safePage)).toContainText('Admin')
    })

    test('should remove the member when the step-up succeeds', async ({ safePage }) => {
      await safePage.goto(`/spaces/members?spaceId=${workspaceId}`)

      await memberRow(safePage).getByRole('button', { name: 'Remove member' }).click()
      await safePage.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
      await completeStepUp(safePage)

      await expectActionReplayed(safePage, pageUrl('/spaces/members'), 'Member removed')
      await expect(memberRow(safePage)).toBeHidden()
      expect(await workspaceResource(safePage, workspaceId, 'members')).not.toContain(MEMBER_NAME)
    })
  })

  test('should add the contact to the Workspace address book when the step-up succeeds', async ({ safePage }) => {
    await safePage.goto(`/spaces/address-book?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Add shared contact' }).click()
    const dialog = safePage.getByRole('dialog')
    await dialog.getByRole('textbox', { name: 'Name' }).fill(CONTACT.name)
    await dialog.getByRole('textbox', { name: 'Address or ENS' }).fill(CONTACT.address)
    await dialog.getByRole('button', { name: 'Add contact' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/address-book'), 'Address book updated')
    await expect(safePage.getByRole('row').filter({ hasText: CONTACT.name })).toBeVisible()
  })

  test('should remove the contact from the Workspace address book when the step-up succeeds', async ({ safePage }) => {
    await gatewayRequest(setup, 'PUT', `/v1/spaces/${workspaceId}/address-book`, {
      items: [{ ...CONTACT, chainIds: [SEPOLIA] }],
    })
    await safePage.goto(`/spaces/address-book?spaceId=${workspaceId}`)

    await safePage
      .getByRole('row')
      .filter({ hasText: CONTACT.name })
      .getByRole('button', { name: 'Delete entry' })
      .click()
    await safePage.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/address-book'), 'Address removed from the address book')
    await expect(safePage.getByRole('row').filter({ hasText: CONTACT.name })).toBeHidden()
  })

  test('should approve the contact request of a member when the step-up succeeds', async ({ safePage, browser }) => {
    const member = await joinAsMember(browser, 'Requester')
    await gatewayRequest(member, 'POST', `/v1/spaces/${workspaceId}/address-book/requests`, {
      ...CONTACT,
      chainIds: [SEPOLIA],
    })
    await member.context().close()
    await safePage.goto(`/spaces/address-book?spaceId=${workspaceId}`)

    await safePage.getByRole('tab', { name: 'Pending (1)' }).click()
    await safePage.getByTestId('approve-request-btn').click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, pageUrl('/spaces/address-book'), 'Address book request approved')
    await expect(safePage.getByRole('tab', { name: 'Workspace contacts (1)' })).toBeVisible()
    expect(await workspaceResource(safePage, workspaceId, 'address-book')).toContain(CONTACT.name)
  })

  test('should delete the Workspace from the Workspace list when the step-up succeeds', async ({ safePage }) => {
    // Only a Workspace without a subscription that could still bill can be deleted.
    await storeSubscription(workspaceId, { status: 'canceled' })
    await safePage.goto('/welcome/spaces')

    const card = safePage.getByRole('link').filter({ hasText: 'Step-up actions' })
    await expect(card).toBeVisible()
    await safePage.getByRole('button', { name: 'Open space actions' }).click()
    await safePage.getByRole('menuitem', { name: 'Remove' }).click()
    const dialog = safePage.getByRole('alertdialog')
    await dialog.getByTestId('space-confirm-name-input').fill('Step-up actions')
    await dialog.getByRole('button', { name: 'Delete Workspace' }).click()
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, /\/welcome\/spaces$/, 'Workspace deleted')
    await expect(card).toBeHidden()
  })
})
