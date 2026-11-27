// These flows start outside a Workspace; once the step-up completes, the flow goes on to its next page.
import { test, expect } from '../../../src/fixtures/test.fixture'
import { safeAddress } from '../../../src/data/constants'
import {
  createWorkspace,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { completeStepUp, expectActionCompleted } from '../../../src/fixtures/step-up'

const WORKSPACE_NAME = 'Step-up outside'

test.describe('Step-up for the Workspace actions outside a Workspace', { tag: '@regression' }, () => {
  let user: EmailSession

  /** Creating a Workspace needs no step-up, so the user's own session prepares it, with a plan. */
  async function prepareWorkspace(): Promise<string> {
    const workspaceId = (await createWorkspace(user, WORKSPACE_NAME)).uuid
    await storeSubscription(user, workspaceId)
    return workspaceId
  }

  test.beforeEach(async ({ safePage }) => {
    user = await signInWithEmail(safePage, uniqueEmail('step-up-outside'), { secondFactor: false })
  })

  test('should add the Safe to the chosen Workspace when the step-up from its Safe page succeeds', async ({
    safePage,
    safes,
  }) => {
    const workspaceId = await prepareWorkspace()
    await safePage.goto(`/home?safe=${safes.basic}`)

    await safePage.getByRole('button', { name: 'Add Safe to Workspace' }).click()
    await safePage.getByRole('menuitem', { name: WORKSPACE_NAME }).click()
    await completeStepUp(safePage)

    // The Safe opens inside the Workspace it now belongs to.
    const safeParam = safes.basic.replace(':', '(:|%3A)')
    const safePageUrl = new RegExp(`/home\\?safe=${safeParam}&spaceId=${workspaceId}$`)
    await expectActionCompleted(safePage, safePageUrl, 'Successfully added Safe to Workspace')
    await expect(safePage.getByRole('button', { name: 'Add Safe to Workspace' })).toBeHidden()
    expect(await workspaceResource(user, workspaceId, 'safes')).toContain(safeAddress(safes.basic))
  })

  test('should add a new pay-later Safe to the Workspace when the step-up after its creation succeeds', async ({
    safePage,
    walletPage,
    owners,
  }) => {
    const workspaceId = await prepareWorkspace()
    await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Add accounts' }).click()
    await safePage.getByRole('button', { name: 'Create new Safe' }).click()
    await walletPage.connectWallet(owners.alice.privateKey)
    await safePage.getByRole('button', { name: 'Next' }).click()
    await safePage.getByRole('button', { name: 'Next' }).click()
    await expect(safePage.getByRole('radio', { name: 'Pay later' })).toBeChecked()
    await safePage.getByRole('button', { name: 'Create account' }).click()
    await completeStepUp(safePage)

    // The creation goes on to the new Safe; the router later decodes the `:`.
    await expectActionCompleted(safePage, new RegExp(`/home\\?safe=sep(:|%3A)0x\\w{40}&spaceId=${workspaceId}$`))
    const newSafe = new URL(safePage.url()).searchParams.get('safe') ?? ''
    expect(await workspaceResource(user, workspaceId, 'safes')).toContain(safeAddress(newSafe))
  })
})
