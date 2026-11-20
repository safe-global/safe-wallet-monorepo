import local from '@/services/local-storage/local'
import { makeStore } from '@/store'
import { HYDRATE_ACTION } from '@/store/hydrateAction'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { DRAFT_MAX_AGE_MS, EMPTY_WORKSPACE_DRAFT } from '../workspaceDraftSlice'

const storedDraft = (ageMs: number) =>
  workspaceDraftBuilder()
    .with({ ownerId: fakeUserId(), name: fakeWorkspaceName(), updatedAt: Date.now() - ageMs })
    .build()

const hydrate = (draft: ReturnType<typeof storedDraft>) => {
  const store = makeStore()
  store.dispatch({ type: HYDRATE_ACTION, payload: { workspaceDraft: draft } })
  return store
}

describe('workspaceDraftExpiryListener', () => {
  beforeEach(() => localStorage.clear())

  it('clears a draft that expired while the app was closed, in the store and in localStorage', async () => {
    const store = hydrate(storedDraft(DRAFT_MAX_AGE_MS + 1))

    await Promise.resolve()

    expect(store.getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
    expect(local.getItem('workspaceDraft')).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('keeps a draft that is still fresh', async () => {
    const draft = storedDraft(DRAFT_MAX_AGE_MS - 60_000)
    const store = hydrate(draft)

    await Promise.resolve()

    expect(store.getState().workspaceDraft).toEqual(draft)
  })
})
