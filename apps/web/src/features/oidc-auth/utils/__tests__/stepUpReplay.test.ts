import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { server } from '@/tests/server'
import { stepUpReturning } from '../../store'
import { replayStepUpAction, saveStepUpTrip, takeStepUpTrip, toReplayableRequest } from '../stepUpReplay'

const INVITE_REQUEST = { url: '/v1/spaces/7/members', method: 'POST', body: { users: [] } }

describe('toReplayableRequest', () => {
  it('should, when a gated endpoint is given, keep its name and the prepared request', () => {
    expect(toReplayableRequest('membersInviteUserV1', INVITE_REQUEST)).toEqual({
      endpoint: 'membersInviteUserV1',
      request: INVITE_REQUEST,
    })
  })

  it('should accept every gated endpoint', () => {
    const gated = [
      'spaceSafesCreateV1',
      'spaceSafesDeleteV1',
      'spacesUpdateV1',
      'spacesDeleteV1',
      'membersInviteUserV1',
      'membersUpdateRoleV1',
      'membersRemoveUserV1',
      'addressBooksUpsertAddressBookItemsV1',
      'addressBooksDeleteByAddressV1',
      'addressBookRequestsApproveRequestV1',
    ]

    expect(gated.map((endpoint) => toReplayableRequest(endpoint, INVITE_REQUEST)?.endpoint)).toEqual(gated)
  })

  it('should, when the endpoint is outside the gated set, return undefined', () => {
    expect(toReplayableRequest('spacesCreateV1', INVITE_REQUEST)).toBeUndefined()
  })
})

describe('step-up trip storage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.useRealTimers()
  })

  it('should, when an action was saved, return it on take', () => {
    const action = { endpoint: 'membersInviteUserV1', request: INVITE_REQUEST } as const
    saveStepUpTrip(action)

    expect(takeStepUpTrip()).toEqual({ action })
  })

  it('should, when the trip has no replayable action, return a bare trip', () => {
    saveStepUpTrip(undefined)

    expect(takeStepUpTrip()).toEqual({})
  })

  it('should, when a trip is taken, remove it so nothing is acted on twice or by a later trip', () => {
    saveStepUpTrip({ endpoint: 'spacesDeleteV1', request: { url: '/v1/spaces/1', method: 'DELETE' } })

    expect(takeStepUpTrip()).toBeDefined()
    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when nothing is stored, return undefined', () => {
    expect(takeStepUpTrip()).toBeUndefined()
  })

  it('should, when the stored trip is older than the challenge window, return undefined and delete it', () => {
    jest.useFakeTimers()
    saveStepUpTrip({ endpoint: 'membersInviteUserV1', request: INVITE_REQUEST })

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
    sessionStorage.setItem('oidc_step_up', JSON.stringify({ endpoint: 'spacesUpdateV1', request: INVITE_REQUEST }))

    expect(takeStepUpTrip()).toBeUndefined()
    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
  })

  it('should, when a fresh record names an endpoint that is no longer gated, return a bare trip', () => {
    sessionStorage.setItem(
      'oidc_step_up',
      JSON.stringify({ endpoint: 'somethingElse', request: INVITE_REQUEST, createdAt: Date.now() }),
    )

    expect(takeStepUpTrip()).toEqual({})
  })

  it('should, when a fresh record holds arguments instead of a request, return a bare trip', () => {
    sessionStorage.setItem(
      'oidc_step_up',
      JSON.stringify({ endpoint: 'spaceSafesDeleteV1', args: { spaceId: '7' }, createdAt: Date.now() }),
    )

    expect(takeStepUpTrip()).toEqual({})
  })
})

describe('replayStepUpAction', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('should, when the list query is still in flight with two subscribers while the replay completes, fetch the list again so it shows the added Safe', async () => {
    const spaceId = faker.string.uuid()
    const existingSafe = faker.finance.ethereumAddress()
    const addedSafe = faker.finance.ethereumAddress()
    const listRequests: string[] = []
    let releaseFirstList: () => void = () => {}
    const firstListReleased = new Promise<void>((resolve) => (releaseFirstList = resolve))
    let mutationReceived: () => void = () => {}
    const mutationArrived = new Promise<void>((resolve) => (mutationReceived = resolve))

    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, async () => {
        listRequests.push('GET')
        if (listRequests.length === 1) {
          await firstListReleased
          return HttpResponse.json({ safes: { '1': [existingSafe] } })
        }
        return HttpResponse.json({ safes: { '1': [existingSafe, addedSafe] } })
      }),
      http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
        mutationReceived()
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const store = makeStore(undefined, { skipBroadcast: true })
    store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))

    const replay = replayStepUpAction(store.dispatch, {
      endpoint: 'spaceSafesCreateV1',
      request: {
        url: `/v1/spaces/${spaceId}/safes`,
        method: 'POST',
        body: { safes: [{ chainId: '1', address: addedSafe }] },
      },
    })
    await mutationArrived
    await Promise.all(store.dispatch(cgwApi.util.getRunningMutationsThunk()))
    releaseFirstList()
    await replay

    expect(listRequests).toHaveLength(2)
    // `select` is typed against the generated API's own root state, so the cache is
    // read through `initiate`, which resolves from the cache once the query is settled.
    const list = await store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    expect(list.data).toEqual({ safes: { '1': [existingSafe, addedSafe] } })
    expect(selectNotifications(store.getState())).toEqual([
      expect.objectContaining({ message: 'Safe account added', variant: 'success' }),
    ])
  })

  it('should, when no query is in flight while the replay completes, fetch the list after the mutation and once more before the toast', async () => {
    const spaceId = faker.string.uuid()
    const existingSafe = faker.finance.ethereumAddress()
    const addedSafe = faker.finance.ethereumAddress()
    const listRequests: string[] = []

    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
        listRequests.push('GET')
        if (listRequests.length === 1) {
          return HttpResponse.json({ safes: { '1': [existingSafe] } })
        }
        return HttpResponse.json({ safes: { '1': [existingSafe, addedSafe] } })
      }),
      http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => HttpResponse.json({}, { status: 201 })),
    )

    const store = makeStore(undefined, { skipBroadcast: true })
    await store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))

    await replayStepUpAction(store.dispatch, {
      endpoint: 'spaceSafesCreateV1',
      request: {
        url: `/v1/spaces/${spaceId}/safes`,
        method: 'POST',
        body: { safes: [{ chainId: '1', address: addedSafe }] },
      },
    })

    expect(listRequests).toHaveLength(3)
    const list = await store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    expect(list.data).toEqual({ safes: { '1': [existingSafe, addedSafe] } })
  })

  it('should, when a list query with two subscribers starts while the replayed mutation is in flight, fetch the list again so it shows the added Safe', async () => {
    const spaceId = faker.string.uuid()
    const existingSafe = faker.finance.ethereumAddress()
    const addedSafe = faker.finance.ethereumAddress()
    const listRequests: string[] = []
    let releaseFirstList: () => void = () => {}
    const firstListReleased = new Promise<void>((resolve) => (releaseFirstList = resolve))
    let releaseMutation: () => void = () => {}
    const mutationReleased = new Promise<void>((resolve) => (releaseMutation = resolve))
    let mutationReceived: () => void = () => {}
    const mutationArrived = new Promise<void>((resolve) => (mutationReceived = resolve))

    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, async () => {
        listRequests.push('GET')
        if (listRequests.length === 1) {
          await firstListReleased
          return HttpResponse.json({ safes: { '1': [existingSafe] } })
        }
        return HttpResponse.json({ safes: { '1': [existingSafe, addedSafe] } })
      }),
      http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, async () => {
        mutationReceived()
        await mutationReleased
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const store = makeStore(undefined, { skipBroadcast: true })
    const replay = replayStepUpAction(store.dispatch, {
      endpoint: 'spaceSafesCreateV1',
      request: {
        url: `/v1/spaces/${spaceId}/safes`,
        method: 'POST',
        body: { safes: [{ chainId: '1', address: addedSafe }] },
      },
    })
    await mutationArrived
    store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    await new Promise((resolve) => setTimeout(resolve, 5))
    releaseMutation()
    await Promise.all(store.dispatch(cgwApi.util.getRunningMutationsThunk()))
    releaseFirstList()
    await replay

    expect(listRequests).toHaveLength(2)
    const list = await store.dispatch(cgwApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    expect(list.data).toEqual({ safes: { '1': [existingSafe, addedSafe] } })
  })

  it('should, when a query the mutation does not invalidate is in flight while the replay completes, not fetch it again', async () => {
    const spaceId = faker.string.uuid()
    const userRequests: string[] = []
    let releaseUser: () => void = () => {}
    const userReleased = new Promise<void>((resolve) => (releaseUser = resolve))
    let mutationReceived: () => void = () => {}
    const mutationArrived = new Promise<void>((resolve) => (mutationReceived = resolve))

    server.use(
      http.get(`${GATEWAY_URL}/v1/users`, async () => {
        userRequests.push('GET')
        await userReleased
        return HttpResponse.json({ id: 1, status: 'ACTIVE', wallets: [] })
      }),
      http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => {
        mutationReceived()
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const store = makeStore(undefined, { skipBroadcast: true })
    store.dispatch(usersApi.endpoints.usersGetWithWalletsV1.initiate())
    store.dispatch(usersApi.endpoints.usersGetWithWalletsV1.initiate())

    const replay = replayStepUpAction(store.dispatch, {
      endpoint: 'spaceSafesCreateV1',
      request: {
        url: `/v1/spaces/${spaceId}/safes`,
        method: 'POST',
        body: { safes: [{ chainId: '1', address: faker.finance.ethereumAddress() }] },
      },
    })
    await mutationArrived
    await Promise.all(store.dispatch(cgwApi.util.getRunningMutationsThunk()))
    releaseUser()
    await replay

    expect(userRequests).toHaveLength(1)
    expect(selectNotifications(store.getState())).toEqual([
      expect.objectContaining({ message: 'Safe account added', variant: 'success' }),
    ])
  })

  it('should, when the replayed mutation is rejected because the session is not elevated, stay silent and not save another trip', async () => {
    const spaceId = faker.string.uuid()

    server.use(
      http.post(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () =>
        HttpResponse.json({ message: 'elevation_required', statusCode: 403 }, { status: 403 }),
      ),
    )

    const store = makeStore(undefined, { skipBroadcast: true })
    store.dispatch(stepUpReturning())

    await replayStepUpAction(store.dispatch, {
      endpoint: 'spaceSafesCreateV1',
      request: {
        url: `/v1/spaces/${spaceId}/safes`,
        method: 'POST',
        body: { safes: [{ chainId: '1', address: faker.finance.ethereumAddress() }] },
      },
    })

    expect(sessionStorage.getItem('oidc_step_up')).toBeNull()
    expect(selectNotifications(store.getState())).toEqual([])
  })
})
