import { test, expect } from '../../../src/fixtures/test.fixture'
import {
  createEmailSession,
  createWorkspace,
  gatewayRequest,
  memberStatus,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
} from '../../../src/fixtures/email-session'
import { WorkspacePage } from '../../../src/pages/workspace.page'

test.describe('Workspace invite', { tag: '@regression' }, () => {
  test('should make the invitee a member when they accept the invite from the Workspace list', async ({
    safePage,
  }, testInfo) => {
    const workspaceName = `Invite ${testInfo.testId.slice(0, 8)}`
    const memberEmail = uniqueEmail('invitee')
    const admin = await createEmailSession(uniqueEmail('admin'))
    const { uuid } = await createWorkspace(admin, workspaceName)
    await storeSubscription(admin, uuid)
    await gatewayRequest(admin, 'POST', `/v1/spaces/${uuid}/members/invite`, {
      users: [{ type: 'email', email: memberEmail, role: 'MEMBER', name: 'Invitee' }],
    })
    await signInWithEmail(safePage, memberEmail)

    const workspace = new WorkspacePage(safePage)
    await safePage.goto('/welcome/spaces')
    await expect(workspace.inviteBanner(workspaceName)).toContainText('You were invited to join')
    await workspace.acceptInvite(workspaceName, 'Invitee')

    await expect(safePage.getByText(`Accepted invite to ${workspaceName}`)).toBeVisible()
    await expect(safePage).toHaveURL((url) => url.searchParams.get('spaceId') === uuid)
    expect(await memberStatus(admin, uuid, memberEmail)).toBe('ACTIVE')
  })
})
