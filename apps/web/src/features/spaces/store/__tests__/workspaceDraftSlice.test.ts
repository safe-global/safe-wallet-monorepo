import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import {
  DRAFT_MAX_AGE_MS,
  EMPTY_WORKSPACE_DRAFT,
  clearWorkspaceDraft,
  updateWorkspaceDraft,
  usableDraft,
  workspaceDraftSlice,
} from '../workspaceDraftSlice'

const reducer = workspaceDraftSlice.reducer
const NOW = Date.UTC(2026, 10, 12)

describe('workspaceDraftSlice', () => {
  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(NOW))
  afterEach(() => jest.restoreAllMocks())

  it('merges each change into the owner’s draft and stamps it', () => {
    const ownerId = fakeUserId()
    const name = fakeWorkspaceName()
    const safe = { chainId: '1', address: fakerChecksummedAddress() }

    const named = reducer(EMPTY_WORKSPACE_DRAFT, updateWorkspaceDraft(ownerId, { name }))
    const withSafe = reducer(named, updateWorkspaceDraft(ownerId, { safes: [safe] }))

    expect(withSafe).toEqual({ ...EMPTY_WORKSPACE_DRAFT, ownerId, updatedAt: NOW, name, safes: [safe] })
  })

  it('starts from an empty form when another user writes', () => {
    const theirs = reducer(EMPTY_WORKSPACE_DRAFT, updateWorkspaceDraft(fakeUserId(), { name: fakeWorkspaceName() }))
    const me = fakeUserId() + 100_000
    const paymentLinkId = `plink_${faker.string.alphanumeric(10)}`

    const mine = reducer(theirs, updateWorkspaceDraft(me, { paymentLinkId }))

    expect(mine).toEqual({ ...EMPTY_WORKSPACE_DRAFT, ownerId: me, updatedAt: NOW, paymentLinkId })
  })

  it('empties the draft on clear', () => {
    const draft = reducer(EMPTY_WORKSPACE_DRAFT, updateWorkspaceDraft(fakeUserId(), { name: fakeWorkspaceName() }))

    expect(reducer(draft, clearWorkspaceDraft())).toEqual(EMPTY_WORKSPACE_DRAFT)
  })
})

describe('usableDraft', () => {
  const ownerId = fakeUserId()
  const draft = workspaceDraftBuilder().with({ ownerId, updatedAt: NOW, name: fakeWorkspaceName() }).build()

  it('returns the draft to its owner while it is fresh', () => {
    expect(usableDraft(draft, ownerId, NOW + DRAFT_MAX_AGE_MS - 1)).toBe(draft)
  })

  it.each([
    ['another user', ownerId + 1, NOW],
    ['a signed-out user', undefined, NOW],
    ['its owner once it is 30 days old', ownerId, NOW + DRAFT_MAX_AGE_MS],
  ])('reads as an empty form for %s', (_, reader, now) => {
    expect(usableDraft(draft, reader, now)).toBe(EMPTY_WORKSPACE_DRAFT)
  })

  it('reads as an empty form when it was never saved', () => {
    const unsaved = workspaceDraftBuilder().with({ ownerId, updatedAt: null }).build()

    expect(usableDraft(unsaved, ownerId, NOW)).toBe(EMPTY_WORKSPACE_DRAFT)
  })
})
