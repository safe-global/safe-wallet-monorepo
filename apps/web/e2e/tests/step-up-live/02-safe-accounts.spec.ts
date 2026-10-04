/**
 * Live step-up — Safe accounts in the run's Workspace (A5, A6, B1, A23, A38, A39, A41 of the Oct 1 QA run).
 */
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel } from '../../src/fixtures/step-up'
import { seedConnectedWallet } from '../../src/fixtures/seed-wallet'
import { STEP_UP_SAFES } from '../../src/data/constants'
import { WorkspacePage } from '../../src/pages/workspace.page'

const SAFES = /\/v1\/spaces\/[^/]+\/safes$/
const ADDRESS_BOOK = /\/v1\/spaces\/[^/]+\/address-book$/
const COUNTERFACTUAL = /\/v1\/users\/counterfactual-safes$/

const short = (address: string) => new RegExp(address.slice(0, 6), 'i')

test.describe('Step-up live — Safe accounts', { tag: '@step-up-live' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('adds a Safe by address with a name after a fresh code, renames it after another, removes it inside the window', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const [address] = STEP_UP_SAFES
    const name = uniqueLabel('Step-up Safe')
    const renamed = uniqueLabel('Step-up renamed')
    await ws.goto('/spaces/safe-accounts', workspace.spaceId)

    await test.step('A5: add by address + name → step-up → Safe listed with its name', async () => {
      await ws.addSafeByAddress(address, name)
      await lapse()
      await ws.submitAddAccounts()
      await stepUp()
      await expect(ws.row(name)).toBeVisible()
      expect(traffic.callsTo('POST', SAFES).map((c) => c.status)).toEqual([403, 201])
    })

    await test.step('A6: rename after the window → step-up → new name shown', async () => {
      await lapse()
      await ws.renameSafe(short(address), renamed)
      await stepUp()
      await expect(ws.row(renamed)).toBeVisible()
      expect(traffic.callsTo('PUT', ADDRESS_BOOK).map((c) => c.status)).toEqual([403, 200])
    })

    await test.step('B1: remove inside the window → no challenge', async () => {
      await ws.removeSafe(short(address))
      await expect(ws.row(renamed)).toBeHidden()
      expect(traffic.callsTo('DELETE', SAFES).map((c) => c.status)).toEqual([204])
      expect(traffic.elevateRequests).toHaveLength(2)
    })
  })

  test('adds a Safe from the Safe sidebar after a fresh code and stays on the Safe (A38)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const address = STEP_UP_SAFES[1]

    await safePage.goto(`/home?safe=sep:${address}`)
    await lapse()
    await ws.addSafeFromSafeSidebar(workspace.spaceName)
    await stepUp()

    await expect(safePage).toHaveURL(new RegExp(`/home\\?safe=sep:${address}.*spaceId=${workspace.spaceId}`, 'i'))
    await expect(safePage.getByTestId('add-safe-to-workspace-button')).toBeHidden()
    expect(traffic.callsTo('POST', SAFES).map((c) => c.status)).toEqual([403, 201])
  })

  test('creates a Pay later Safe on one network and keeps its name across the step-up (A23, A41)', async ({
    safePage,
    workspace,
    creds,
    traffic,
    lapse,
    stepUp,
  }) => {
    test.skip(!creds.adminKey, 'Creating a Safe needs a signer: set STEP_UP_ADMIN_KEY.')
    await seedConnectedWallet(safePage, creds.adminKey as string)
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Step-up pay later')

    await ws.goto('/spaces/safe-accounts', workspace.spaceId)
    await lapse()
    await ws.createSafePayLater(name)
    await stepUp()

    await expect(safePage).toHaveURL(new RegExp(`/home\\?safe=sep:0x[0-9a-fA-F]{40}.*spaceId=${workspace.spaceId}`))
    expect(traffic.callsTo('POST', COUNTERFACTUAL).map((c) => c.status)).toEqual([201])
    expect(traffic.callsTo('POST', SAFES).map((c) => c.status)).toEqual([403, 201])
    await ws.goto('/spaces/safe-accounts', workspace.spaceId)
    await expect(ws.row(name)).toBeVisible()
  })

  test('creates a Pay later Safe on two networks with one step-up (A39)', async ({
    safePage,
    workspace,
    creds,
    traffic,
    lapse,
    stepUp,
  }) => {
    test.skip(!creds.adminKey, 'Creating a Safe needs a signer: set STEP_UP_ADMIN_KEY.')
    await seedConnectedWallet(safePage, creds.adminKey as string)
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Step-up multichain')

    await ws.goto('/spaces/safe-accounts', workspace.spaceId)
    await lapse()
    await ws.createSafePayLater(name, [/^Polygon/])
    await stepUp()

    await expect(safePage).toHaveURL(new RegExp(`spaceId=${workspace.spaceId}`))
    expect(traffic.callsTo('POST', COUNTERFACTUAL).map((c) => c.status)).toEqual([201, 201])
    expect(traffic.callsTo('POST', SAFES).map((c) => c.status)).toEqual([403, 201])
    expect(traffic.elevateRequests).toHaveLength(1)
  })
})
