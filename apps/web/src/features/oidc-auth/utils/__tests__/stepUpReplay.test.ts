import { faker } from '@faker-js/faker'
import { getReplayableAction, saveStepUpTrip, takeStepUpTrip } from '../stepUpReplay'

const rejectedMutation = (endpointName: string, originalArgs: unknown) => ({
  type: 'cgwClient/executeMutation/rejected',
  payload: { status: 403, data: { message: 'elevation_required' } },
  meta: { arg: { type: 'mutation', endpointName, originalArgs }, requestStatus: 'rejected' },
})

describe('getReplayableAction', () => {
  it('should, when a rejected gated mutation is given, return its endpoint and args', () => {
    const args = { spaceId: faker.string.numeric(3) }

    expect(getReplayableAction(rejectedMutation('spaceSafesCreateV1', args))).toEqual({
      endpoint: 'spaceSafesCreateV1',
      args,
    })
  })

  it('should, when the rejected mutation targets any gated endpoint, return that endpoint', () => {
    expect(getReplayableAction(rejectedMutation('spaceSafesCreateV1', {}))?.endpoint).toBe('spaceSafesCreateV1')
    expect(getReplayableAction(rejectedMutation('spaceSafesDeleteV1', {}))?.endpoint).toBe('spaceSafesDeleteV1')
    expect(getReplayableAction(rejectedMutation('spacesUpdateV1', {}))?.endpoint).toBe('spacesUpdateV1')
    expect(getReplayableAction(rejectedMutation('spacesDeleteV1', {}))?.endpoint).toBe('spacesDeleteV1')
    expect(getReplayableAction(rejectedMutation('membersInviteUserV1', {}))?.endpoint).toBe('membersInviteUserV1')
    expect(getReplayableAction(rejectedMutation('membersUpdateRoleV1', {}))?.endpoint).toBe('membersUpdateRoleV1')
    expect(getReplayableAction(rejectedMutation('membersRemoveUserV1', {}))?.endpoint).toBe('membersRemoveUserV1')
    expect(getReplayableAction(rejectedMutation('addressBooksUpsertAddressBookItemsV1', {}))?.endpoint).toBe(
      'addressBooksUpsertAddressBookItemsV1',
    )
    expect(getReplayableAction(rejectedMutation('addressBooksDeleteByAddressV1', {}))?.endpoint).toBe(
      'addressBooksDeleteByAddressV1',
    )
    expect(getReplayableAction(rejectedMutation('addressBookRequestsApproveRequestV1', {}))?.endpoint).toBe(
      'addressBookRequestsApproveRequestV1',
    )
  })

  it('should, when the rejected mutation targets an endpoint outside the gated set, return undefined', () => {
    expect(getReplayableAction(rejectedMutation('spacesCreateV1', {}))).toBeUndefined()
  })

  it('should, when the action has no meta, return undefined', () => {
    expect(getReplayableAction({ type: 'x' })).toBeUndefined()
  })

  it('should, when the action has no arg, return undefined', () => {
    expect(getReplayableAction({ type: 'x', meta: {} })).toBeUndefined()
  })

  it('should, when the action has no endpointName, return undefined', () => {
    expect(getReplayableAction({ type: 'x', meta: { arg: {} } })).toBeUndefined()
  })
})

describe('step-up trip storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.useRealTimers()
  })

  it('should, when an action was saved, return it on take', () => {
    const action = { endpoint: 'membersInviteUserV1', args: { spaceId: '7' } } as const
    saveStepUpTrip(action)

    expect(takeStepUpTrip()).toEqual({ action })
  })

  it('should, when the trip has no replayable action, return a bare trip', () => {
    saveStepUpTrip(undefined)

    expect(takeStepUpTrip()).toEqual({})
  })

  it('should, when a trip is taken, remove it so nothing is acted on twice or by a later trip', () => {
    saveStepUpTrip({ endpoint: 'spacesDeleteV1', args: { id: '1' } })

    expect(takeStepUpTrip()).toBeDefined()
    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when nothing is stored, return undefined', () => {
    expect(takeStepUpTrip()).toBeUndefined()
  })

  it('should, when the stored trip is older than the challenge window, return undefined and delete it', () => {
    jest.useFakeTimers()
    saveStepUpTrip({ endpoint: 'membersInviteUserV1', args: {} })

    jest.advanceTimersByTime(5 * 60 * 1_000 + 1)

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when the stored record is malformed JSON, return undefined and delete it', () => {
    sessionStorage.setItem('oidc_step_up', '{not json')

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when the stored record has no createdAt, return undefined and delete it', () => {
    sessionStorage.setItem('oidc_step_up', JSON.stringify({ endpoint: 'spacesUpdateV1', args: {} }))

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when a fresh record names an endpoint that is no longer gated, return a bare trip', () => {
    sessionStorage.setItem(
      'oidc_step_up',
      JSON.stringify({ endpoint: 'somethingElse', args: {}, createdAt: Date.now() }),
    )

    expect(takeStepUpTrip()).toEqual({})
  })
})
