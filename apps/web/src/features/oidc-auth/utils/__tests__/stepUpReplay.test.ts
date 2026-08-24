import { faker } from '@faker-js/faker'
import { clearStepUpTrip, getReplayableAction, saveStepUpTrip, takeStepUpTrip } from '../stepUpReplay'

// Mirrors the thunk arg RTK Query builds for a mutation.
const rejectedMutation = (endpointName: string, originalArgs: unknown) => ({
  type: 'cgwClient/executeMutation/rejected',
  payload: { status: 403, data: { message: 'elevation_required' } },
  meta: { arg: { type: 'mutation', endpointName, originalArgs }, requestStatus: 'rejected' },
})

describe('getReplayableAction', () => {
  it('reads the endpoint and args off a rejected gated mutation', () => {
    const args = { spaceId: faker.string.numeric(3) }

    expect(getReplayableAction(rejectedMutation('spaceSafesCreateV1', args))).toEqual({
      endpoint: 'spaceSafesCreateV1',
      args,
    })
  })

  it.each([
    'spaceSafesDeleteV1',
    'spacesUpdateV1',
    'spacesDeleteV1',
    'membersInviteUserV1',
    'membersUpdateRoleV1',
    'membersRemoveUserV1',
    'addressBooksUpsertAddressBookItemsV1',
    'addressBooksDeleteByAddressV1',
    'addressBookRequestsApproveRequestV1',
  ])('recognises the gated endpoint %s', (endpoint) => {
    expect(getReplayableAction(rejectedMutation(endpoint, {}))?.endpoint).toBe(endpoint)
  })

  it('ignores an endpoint that is not gated, so nothing is replayed blindly', () => {
    expect(getReplayableAction(rejectedMutation('spacesCreateV1', {}))).toBeUndefined()
  })

  it.each([
    ['null', null],
    ['a non-object', 'rejected'],
    ['an action with no meta', { type: 'x' }],
    ['an action with no arg', { type: 'x', meta: {} }],
    ['an action with no endpointName', { type: 'x', meta: { arg: {} } }],
  ])('returns undefined for %s', (_label, action) => {
    expect(getReplayableAction(action)).toBeUndefined()
  })
})

describe('step-up trip storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.useRealTimers()
  })

  it('round-trips a stored action', () => {
    const action = { endpoint: 'membersInviteUserV1', args: { spaceId: '7' } } as const
    saveStepUpTrip(action)

    expect(takeStepUpTrip()).toEqual({ action })
  })

  it('stores a bare trip for a gated endpoint with no replayable action', () => {
    saveStepUpTrip(undefined)

    expect(takeStepUpTrip()).toEqual({})
  })

  // Regression: the payload used to live in its own key, so a return could
  // consume the in-flight marker and leave the action behind for an unrelated
  // trip to execute. One record cannot disagree with itself.
  it('removes the trip as it is taken, so nothing is acted on twice or by a later trip', () => {
    saveStepUpTrip({ endpoint: 'spacesDeleteV1', args: { id: '1' } })

    expect(takeStepUpTrip()).toBeDefined()
    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('returns undefined when nothing is stored', () => {
    expect(takeStepUpTrip()).toBeUndefined()
  })

  it('discards a stored trip on clear', () => {
    saveStepUpTrip({ endpoint: 'spacesUpdateV1', args: {} })
    clearStepUpTrip()

    expect(takeStepUpTrip()).toBeUndefined()
  })

  // A trip cannot validly outlive CGW's 5-minute state cookie; anything older is
  // residue of an abandoned trip and must never be acted on.
  it('deletes an expired trip unexamined', () => {
    jest.useFakeTimers()
    saveStepUpTrip({ endpoint: 'membersInviteUserV1', args: {} })

    jest.advanceTimersByTime(5 * 60 * 1_000 + 1)

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it.each([
    ['malformed JSON', '{not json'],
    ['a record with no createdAt', JSON.stringify({ endpoint: 'spacesUpdateV1', args: {} })],
  ])('rejects %s rather than acting on it', (_label, raw) => {
    sessionStorage.setItem('oidc_step_up', raw)

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('treats a fresh record whose endpoint is no longer gated as a bare trip', () => {
    sessionStorage.setItem(
      'oidc_step_up',
      JSON.stringify({ endpoint: 'somethingElse', args: {}, createdAt: Date.now() }),
    )

    expect(takeStepUpTrip()).toEqual({})
  })
})
