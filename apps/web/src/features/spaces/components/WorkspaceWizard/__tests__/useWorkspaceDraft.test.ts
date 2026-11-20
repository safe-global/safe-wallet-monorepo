import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler } from '@/tests/msw/workspaceWizard'
import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { DRAFT_MAX_AGE_MS, EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '../../../public/store/workspaceDraftSlice'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'

const storedDraft = (changes: Partial<WorkspaceDraft> = {}): WorkspaceDraft =>
  workspaceDraftBuilder()
    .with({ ownerId: fakeUserId(), updatedAt: Date.now(), name: fakeWorkspaceName(), ...changes })
    .build()

const renderSignedIn = (draft: WorkspaceDraft, userId: number, wallets: string[] = []) => {
  server.use(userHandler(userId, wallets))
  return renderHook(() => useWorkspaceDraft(), {
    initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
  })
}

describe('useWorkspaceDraft', () => {
  beforeEach(() => localStorage.clear())

  it('gives the owner their draft and wallets once the user is known', async () => {
    const draft = storedDraft()
    const wallet = fakerChecksummedAddress()

    const { result } = renderSignedIn(draft, draft.ownerId ?? 0, [wallet])

    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.draft).toEqual(draft)
    expect(result.current.ownAddresses).toEqual([wallet])
  })

  it.each([
    ['another user', {}, (ownerId: number) => ownerId + 1],
    ['its owner once it has expired', { updatedAt: Date.now() - DRAFT_MAX_AGE_MS }, (ownerId: number) => ownerId],
  ])('reads as an empty form for %s', async (_, changes, readerOf) => {
    const ownerId = fakeUserId()
    const draft = storedDraft({ ownerId, ...changes })

    const { result } = renderSignedIn(draft, readerOf(ownerId))

    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.draft).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('is not ready and refuses to save while the user is unknown', () => {
    const { result } = renderHook(() => useWorkspaceDraft(), {
      initialReduxState: { workspaceDraft: storedDraft() },
    })

    expect(result.current.isReady).toBe(false)
    expect(() => result.current.update({ name: fakeWorkspaceName() })).toThrow(
      'The onboarding draft cannot be saved before the user is known',
    )
  })
})
