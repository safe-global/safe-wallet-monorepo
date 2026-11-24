import { faker } from '@faker-js/faker'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { clearAuthCookie, getAuthCookieAuthorization, setAuthCookie } from '../../../store/cookieStorage'
import { selectAssessmentsByHashes, setBatchAssessments } from '../hnQueueAssessmentsSlice'
import { selectRejectedHypernativeAuthorization } from '../hnSessionSlice'

type Store = ReturnType<typeof makeStore>

const RECONNECT_REQUIRED = {
  success: false,
  data: null,
  error: "Please reconnect your Hypernative account to review this transaction's risks.",
  errorCode: 1038,
}

const hash = () => faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`
const address = () => faker.finance.ethereumAddress() as `0x${string}`

const assessTransaction = (store: Store, authToken: string) =>
  store.dispatch(
    hypernativeApi.endpoints.assessTransaction.initiate({
      authToken,
      safeAddress: address(),
      safeTxHash: hash(),
      transaction: {
        chain: '1',
        input: '0x',
        operation: '0',
        toAddress: address(),
        fromAddress: address(),
        safeTxGas: '0',
        value: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: address(),
        refundReceiver: address(),
        nonce: '0',
      },
    }),
  )

const assessMessage = (store: Store, authToken: string) =>
  store.dispatch(
    hypernativeApi.endpoints.assessMessage.initiate({
      authToken,
      safeAddress: address(),
      messageHash: hash(),
      chain: '1',
      message: { types: { EIP712Domain: [] }, domain: {}, message: {}, primaryType: 'Mail' },
    }),
  )

const getBatchAssessments = (store: Store, authToken: string) =>
  store.dispatch(hypernativeApi.endpoints.getBatchAssessments.initiate({ authToken, safeTxHashes: [hash()] }))

const ENDPOINTS = [
  ['transaction assessment', '/safe/transaction/assessment', assessTransaction],
  ['message assessment', '/safe/eip712/assessment', assessMessage],
  ['queue assessments', '/safe/assessments', getBatchAssessments],
] as const

const tokens = () => ({
  access_token: faker.string.alphanumeric(40),
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read',
  refresh_token: faker.string.alphanumeric(40),
  refresh_expires_in: 2592000,
})

const signIn = (withRefreshToken = true): string => {
  const { refresh_token, refresh_expires_in, ...accessOnly } = tokens()
  setAuthCookie(withRefreshToken ? { ...accessOnly, refresh_token, refresh_expires_in } : accessOnly)
  return getAuthCookieAuthorization() as string
}

const answerWith = (path: string, status: number, body: object) =>
  server.use(http.post(`${HYPERNATIVE_API_BASE_URL}${path}`, () => HttpResponse.json(body, { status })))

const answerTokenRequestWith = (status: number, body: object) => {
  const requests: unknown[] = []
  server.use(
    http.post(`${HYPERNATIVE_API_BASE_URL}/oauth/token`, async ({ request }) => {
      requests.push(await request.json())
      return HttpResponse.json(body, { status })
    }),
  )
  return requests
}

const isRejected = (store: Store) => selectRejectedHypernativeAuthorization(store.getState()) !== undefined

// The listener keeps running after the request it reacts to has settled
const waitForSettledRefresh = async (store: Store) => {
  await waitFor(() =>
    expect(Object.values(store.getState().hypernativeApi.mutations)).toContainEqual(
      expect.objectContaining({ endpointName: 'exchangeToken', status: expect.stringMatching(/fulfilled|rejected/) }),
    ),
  )
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('hnSessionListener', () => {
  afterEach(() => clearAuthCookie())

  it.each(ENDPOINTS)('refreshes the session once when %s answers 1038', async (_label, path, call) => {
    const store = makeStore()
    const rejectedToken = signIn()
    const refreshed = tokens()
    answerWith(path, 401, RECONNECT_REQUIRED)
    const requests = answerTokenRequestWith(200, { success: true, data: refreshed, error: null })

    await call(store, rejectedToken)

    await waitFor(() => expect(getAuthCookieAuthorization()).toBe(`Bearer ${refreshed.access_token}`))
    expect(requests).toEqual([expect.objectContaining({ grant_type: 'refresh_token' })])
    expect(isRejected(store)).toBe(false)
  })

  it('clears the queue assessments that failed before the refresh', async () => {
    const store = makeStore()
    const failedHash = hash()
    store.dispatch(setBatchAssessments({ [failedHash]: null }))
    const rejectedToken = signIn()
    answerWith('/safe/assessments', 401, RECONNECT_REQUIRED)
    answerTokenRequestWith(200, { success: true, data: tokens(), error: null })

    await getBatchAssessments(store, rejectedToken)

    await waitFor(() => expect(selectAssessmentsByHashes(store.getState(), [failedHash])).toEqual({}))
  })

  it.each(ENDPOINTS)('signs out when %s answers 1038 and there is no refresh token', async (_label, path, call) => {
    const store = makeStore()
    const token = signIn(false)
    answerWith(path, 401, RECONNECT_REQUIRED)
    const requests = answerTokenRequestWith(200, { success: true, data: tokens(), error: null })

    await call(store, token)

    await waitFor(() => expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(token))
    expect(getAuthCookieAuthorization()).toBeUndefined()
    expect(requests).toHaveLength(0)
  })

  it('signs out when the refresh answers invalid_grant', async () => {
    const store = makeStore()
    const token = signIn()
    answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
    answerTokenRequestWith(400, { success: false, data: null, error: { error: 'invalid_grant' } })

    await assessTransaction(store, token)

    await waitFor(() => expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(token))
    expect(getAuthCookieAuthorization()).toBeUndefined()
  })

  it('signs out when the refreshed token is rejected with 1038 again', async () => {
    const store = makeStore()
    const refreshed = tokens()
    answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
    const requests = answerTokenRequestWith(200, { success: true, data: refreshed, error: null })
    await assessTransaction(store, signIn())
    const refreshedToken = `Bearer ${refreshed.access_token}`
    await waitFor(() => expect(getAuthCookieAuthorization()).toBe(refreshedToken))

    await assessTransaction(store, refreshedToken)

    await waitFor(() => expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(refreshedToken))
    expect(getAuthCookieAuthorization()).toBeUndefined()
    expect(requests).toHaveLength(1)
  })

  it('keeps the session when the refresh fails for a transient reason', async () => {
    const store = makeStore()
    const token = signIn()
    answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
    answerTokenRequestWith(503, { success: false, data: null, error: 'temporarily_unavailable' })

    await assessTransaction(store, token)
    await waitForSettledRefresh(store)

    expect(getAuthCookieAuthorization()).toBe(token)
    expect(isRejected(store)).toBe(false)
  })

  it('keeps a newer session when a 1038 answers a token that was already replaced', async () => {
    const store = makeStore()
    const replacedToken = `Bearer ${faker.string.alphanumeric(40)}`
    const currentToken = signIn()
    answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
    const requests = answerTokenRequestWith(200, { success: true, data: tokens(), error: null })

    await assessTransaction(store, replacedToken)

    expect(getAuthCookieAuthorization()).toBe(currentToken)
    expect(isRejected(store)).toBe(false)
    expect(requests).toHaveLength(0)
  })

  it('keeps the session when the API refuses the request for another reason', async () => {
    const store = makeStore()
    const token = signIn()
    answerWith('/safe/transaction/assessment', 403, { success: false, data: null, error: 'Forbidden', errorCode: 1027 })
    const requests = answerTokenRequestWith(200, { success: true, data: tokens(), error: null })

    await assessTransaction(store, token)

    expect(getAuthCookieAuthorization()).toBe(token)
    expect(isRejected(store)).toBe(false)
    expect(requests).toHaveLength(0)
  })
})
