/**
 * Live step-up — team management by the email admin, with a second wallet as the member
 * (A9, A10, B4, A27, A29, B5, A30, C1, C2 of the Oct 1 QA run).
 */
import { Wallet } from 'ethers'
import { test, expect } from '../../src/fixtures/step-up.fixture'
import { uniqueLabel } from '../../src/fixtures/step-up'
import { WorkspacePage } from '../../src/pages/workspace.page'

const INVITE = /\/v1\/spaces\/[^/]+\/members\/invite$/
const MEMBER = /\/v1\/spaces\/[^/]+\/members\/\d+$/
const ROLE = /\/v1\/spaces\/[^/]+\/members\/\d+\/role$/
const APPROVE = /\/v1\/spaces\/[^/]+\/address-book\/requests\/[^/]+\/approve$/
const MEMBERS = '/spaces/members'

test.describe('Step-up live — team', { tag: '@step-up-live' }, () => {
  test.describe.configure({ mode: 'serial' })

  test('invites after a fresh code, removes the invitation after another, re-invites inside the window (A9, A10, B4)', async ({
    safePage,
    workspace,
    traffic,
    lapse,
    stepUp,
  }) => {
    const ws = new WorkspacePage(safePage)
    const invitee = Wallet.createRandom().address
    const name = uniqueLabel('Invitee')
    await ws.goto(MEMBERS, workspace.spaceId)

    await test.step('A9: invite after the window → step-up → invitation pending', async () => {
      await lapse()
      await ws.inviteMember(name, invitee)
      await stepUp()
      await safePage.getByTestId('pending-members-tab').click()
      await expect(ws.row(name)).toBeVisible()
    })

    await test.step('A10: remove the invitation after the window → step-up → gone', async () => {
      await lapse()
      await ws.removeInvitation(new RegExp(name))
      await stepUp()
      await safePage.getByTestId('pending-members-tab').click()
      await expect(ws.row(name)).toBeHidden()
      expect(traffic.callsTo('DELETE', MEMBER).map((c) => c.status)).toEqual([403, 200])
    })

    await test.step('B4: invite again inside the window → no challenge', async () => {
      await ws.inviteMember(name, invitee)
      await safePage.getByTestId('pending-members-tab').click()
      await expect(ws.row(name)).toBeVisible()
      expect(traffic.callsTo('POST', INVITE).map((c) => c.status)).toEqual([403, 201, 201])
      expect(traffic.elevateRequests).toHaveLength(2)
    })
  })

  test('a wallet member joins and asks for a contact; the admin approves, changes the role and removes the member after fresh codes (C1, C2, A27, A29, B5, A30)', async ({
    safePage,
    workspace,
    creds,
    traffic,
    lapse,
    stepUp,
    walletSession,
  }) => {
    test.skip(!creds.memberKey, 'Needs a second wallet: set STEP_UP_MEMBER_KEY.')
    const memberKey = creds.memberKey as string
    const memberAddress = new Wallet(memberKey).address
    const memberName = uniqueLabel('Member')
    const requested = uniqueLabel('Requested contact')
    const ws = new WorkspacePage(safePage)

    await test.step('Admin invites the wallet inside the login window or after a step-up', async () => {
      await ws.goto(MEMBERS, workspace.spaceId)
      await ws.inviteMember(memberName, memberAddress)
      if (
        await safePage.waitForURL(/auth0\.com/, { timeout: 10_000 }).then(
          () => true,
          () => false,
        )
      )
        await stepUp()
      await safePage.getByTestId('pending-members-tab').click()
      await expect(ws.row(memberName)).toBeVisible()
    })

    await test.step('C1, C2: the wallet accepts and requests a contact, with no challenge', async () => {
      const member = await walletSession(memberKey)
      const memberWs = new WorkspacePage(member)
      await memberWs.acceptInvite(memberName)
      await expect(member).toHaveURL(/\/spaces\?spaceId=/)
      await memberWs.goto('/spaces/address-book', workspace.spaceId)
      await memberWs.addLocalContact(requested, Wallet.createRandom().address)
      await memberWs.requestToAdd(requested)
      await expect(member.getByText(/request/i).first()).toBeVisible()
      expect(member.url()).not.toMatch(/auth0\.com/)
    })

    await test.step('A27: admin approves the request after the window → step-up', async () => {
      await ws.goto('/spaces/address-book', workspace.spaceId)
      await lapse()
      await ws.approveRequest(requested)
      await stepUp()
      await safePage
        .getByText(/^Workspace contacts/)
        .first()
        .click()
      await expect(ws.row(requested)).toBeVisible()
      expect(traffic.callsTo('PUT', APPROVE).map((c) => c.status)).toEqual([403, 200])
    })

    await test.step('A29, B5: role → Admin after the window, back to Member inside it', async () => {
      await ws.goto(MEMBERS, workspace.spaceId)
      await lapse()
      await ws.setMemberRole(memberName, 'Admin')
      await stepUp()
      await ws.setMemberRole(memberName, 'Member')
      await expect(ws.row(memberName)).toContainText('Member')
      expect(traffic.callsTo('PATCH', ROLE).map((c) => c.status)).toEqual([403, 200, 200])
    })

    await test.step('A30: remove the member after the window → step-up', async () => {
      await lapse()
      await ws.removeMember(memberName)
      await stepUp()
      await safePage.getByTestId('members-tab').click()
      await expect(ws.row(memberName)).toBeHidden()
      expect(traffic.callsTo('DELETE', MEMBER).map((c) => c.status)).toEqual([403, 200])
    })
  })
})
