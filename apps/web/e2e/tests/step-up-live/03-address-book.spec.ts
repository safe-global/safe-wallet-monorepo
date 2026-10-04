/**
 * Live step-up — Workspace address book (A7, A8, A19, A20, A21, A26, A36, B2 of the Oct 1 QA run).
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel } from '../../src/fixtures/step-up'
import { WorkspacePage } from '../../src/pages/workspace.page'

const ADDRESS_BOOK = /\/v1\/spaces\/[^/]+\/address-book$/
const ADDRESS_BOOK_ENTRY = /\/v1\/spaces\/[^/]+\/address-book\/0x[0-9a-fA-F]{40}$/
const PATH = '/spaces/address-book'

test.describe('Step-up live — address book', { tag: '@step-up-live' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('adds a contact after a fresh code, edits it inside the window, deletes it after another code (A7, B2, A8)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Step-up contact')
    const edited = uniqueLabel('Step-up edited')
    await ws.goto(PATH, workspace.spaceId)

    await test.step('A7: add after the window → step-up → contact listed', async () => {
      await lapse()
      await ws.addSharedContact(name, Wallet.createRandom().address)
      await stepUp()
      await expect(ws.row(name)).toBeVisible()
    })

    await test.step('B2: edit inside the window → no challenge', async () => {
      await ws.editContactName(name, edited)
      await expect(ws.row(edited)).toBeVisible()
      expect(traffic.callsTo('PUT', ADDRESS_BOOK).map((c) => c.status)).toEqual([403, 200, 200])
    })

    await test.step('A8: delete after the window → step-up → contact gone', async () => {
      await lapse()
      await ws.deleteContact(edited)
      await stepUp()
      await expect(ws.row(edited)).toBeHidden()
      expect(traffic.callsTo('DELETE', ADDRESS_BOOK_ENTRY).map((c) => c.status)).toEqual([403, 200])
      expect(traffic.elevateRequests).toHaveLength(2)
    })
  })

  test('imports a local contact into the Workspace after a fresh code (A26)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Step-up local')
    await ws.goto(PATH, workspace.spaceId)

    await ws.addLocalContact(name, Wallet.createRandom().address)
    await lapse()
    await ws.importLocalContacts()
    await stepUp()

    await safePage
      .getByText(/^Workspace contacts/)
      .first()
      .click()
    await expect(ws.row(name)).toBeVisible()
    expect(traffic.callsTo('PUT', ADDRESS_BOOK).map((c) => c.status)).toEqual([403, 200])
  })

  test('rejects a wrong code, then accepts the right one (A19)', async ({
    safePage,
    workspace,
    auth0,
    creds,
    lapse,
  }) => {
    const ws = new WorkspacePage(safePage)
    const name = uniqueLabel('Wrong code contact')
    await ws.goto(PATH, workspace.spaceId)

    await lapse()
    await ws.addSharedContact(name, Wallet.createRandom().address)
    await auth0.waitForChallenge()
    await auth0.submitCode('000000')
    await expect(auth0.invalidCodeError).toBeVisible()

    await auth0.completeWithAuthenticator(creds.totpSecret)
    await expect(ws.row(name)).toBeVisible()
  })

  test('saves nothing after Back from the challenge, and the next action replays only itself (A20, A21)', async ({
    safePage,
    workspace,
    auth0,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const abandoned = uniqueLabel('Abandoned contact')
    const kept = uniqueLabel('Kept contact')
    await ws.goto(PATH, workspace.spaceId)

    await lapse()
    await ws.addSharedContact(abandoned, Wallet.createRandom().address)
    await auth0.waitForChallenge()
    await safePage.goBack()
    if (/auth0\.com/.test(safePage.url())) await safePage.goBack()
    await expect(safePage).toHaveURL(new RegExp(PATH))
    await expect(ws.row(abandoned)).toBeHidden()

    await ws.addSharedContact(kept, Wallet.createRandom().address)
    await stepUp()
    await expect(ws.row(kept)).toBeVisible()
    await expect(ws.row(abandoned)).toBeHidden()
    expect(traffic.callsTo('PUT', ADDRESS_BOOK).filter((c) => c.status === 200)).toHaveLength(1)
  })

  test('a second tab saves inside the window opened by the first tab (A36)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const first = uniqueLabel('Tab one contact')
    const second = uniqueLabel('Tab two contact')
    await ws.goto(PATH, workspace.spaceId)
    const otherTab = await safePage.context().newPage()
    const ws2 = new WorkspacePage(otherTab)
    await ws2.goto(PATH, workspace.spaceId)

    await lapse()
    await safePage.bringToFront()
    await ws.addSharedContact(first, Wallet.createRandom().address)
    await stepUp()
    await expect(ws.row(first)).toBeVisible()

    await otherTab.bringToFront()
    const saved = otherTab.waitForResponse(
      (r) => ADDRESS_BOOK.test(new URL(r.url()).pathname) && r.request().method() === 'PUT',
    )
    await ws2.addSharedContact(second, Wallet.createRandom().address)
    expect((await saved).status()).toBe(200)
    await expect(ws2.row(second)).toBeVisible()
    expect(traffic.elevateRequests).toHaveLength(1)
    await otherTab.close()
  })
})
