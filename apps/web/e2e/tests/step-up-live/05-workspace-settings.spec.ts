/**
 * Live step-up — Workspace settings (A11, B3, A37 of the Oct 1 QA run).
 */
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel } from '../../src/fixtures/step-up'
import { CGW_BASE_URL } from '../../src/data/constants'
import { WorkspacePage } from '../../src/pages/workspace.page'

const SPACE = /\/v1\/spaces\/[^/]+$/

test.describe('Step-up live — Workspace settings', { tag: '@step-up-live' }, () => {
  test('renames the Workspace after a fresh code and back inside the window (A11, B3)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const temporary = uniqueLabel('Step-up renamed ws')
    await ws.goto('/spaces/settings/general', workspace.spaceId)
    const nameInput = safePage.getByTestId('space-name-input')
    const original = await nameInput.inputValue()

    await lapse()
    await ws.renameWorkspace(temporary)
    await stepUp()
    await expect(nameInput).toHaveValue(temporary)

    await ws.renameWorkspace(original)
    await expect(nameInput).toHaveValue(original)
    expect(traffic.callsTo('PATCH', SPACE).map((c) => c.status)).toEqual([403, 200, 200])
    expect(traffic.elevateRequests).toHaveLength(1)
  })

  test('deleting the Workspace through the API is refused without a fresh code (A37)', async ({
    safePage,
    workspace,
    lapse,
  }) => {
    await new WorkspacePage(safePage).goto('/spaces', workspace.spaceId)
    // Must run outside the window, or the request would really delete the run's Workspace.
    await lapse()

    const response = await safePage.context().request.delete(`${CGW_BASE_URL}/v1/spaces/${workspace.spaceId}`)

    expect(response.status()).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'elevation_required' })
    expect((await safePage.context().request.get(`${CGW_BASE_URL}/v1/spaces/${workspace.spaceId}`)).status()).toBe(200)
  })
})
