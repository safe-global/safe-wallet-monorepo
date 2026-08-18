import { faker } from '@faker-js/faker'
import {
  clearPendingStepUpAction,
  getReplayableAction,
  savePendingStepUpAction,
  takePendingStepUpAction,
} from '../stepUpReplay'

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

describe('pending action storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips a stored action', () => {
    const action = { endpoint: 'membersInviteUserV1', args: { spaceId: '7' } } as const
    savePendingStepUpAction(action)

    expect(takePendingStepUpAction()).toEqual(action)
  })

  it('removes the action as it is taken, so a failing request is not retried forever', () => {
    savePendingStepUpAction({ endpoint: 'spacesDeleteV1', args: { id: '1' } })

    expect(takePendingStepUpAction()).toBeDefined()
    expect(takePendingStepUpAction()).toBeUndefined()
  })

  it('returns undefined when nothing is stored', () => {
    expect(takePendingStepUpAction()).toBeUndefined()
  })

  it('discards a stored action on clear', () => {
    savePendingStepUpAction({ endpoint: 'spacesUpdateV1', args: {} })
    clearPendingStepUpAction()

    expect(takePendingStepUpAction()).toBeUndefined()
  })

  it.each([
    ['malformed JSON', '{not json'],
    ['an endpoint that is no longer gated', JSON.stringify({ endpoint: 'somethingElse', args: {} })],
  ])('rejects %s rather than replaying it', (_label, raw) => {
    sessionStorage.setItem('oidc_step_up_action', raw)

    expect(takePendingStepUpAction()).toBeUndefined()
  })
})
