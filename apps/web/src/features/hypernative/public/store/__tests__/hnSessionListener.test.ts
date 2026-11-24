import { faker } from '@faker-js/faker'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { clearAuthCookie, getAuthCookieAuthorization, setAuthCookie } from '../../../store/cookieStorage'
import { selectRejectedHypernativeAuthorization } from '../hnSessionSlice'

type Store = ReturnType<typeof makeStore>

const RECONNECT_REQUIRED = {
  success: false,
  data: null,
  error: "Please reconnect your Hypernative account to review this transaction's risks.",
  errorCode: 1038,
}

const INVALID_GRANT = {
  success: false,
  data: null,
  error: { error: 'invalid_grant', error_description: 'Refresh token has been revoked' },
}

const REFRESH_WINDOW_SECONDS = 2592000

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

const signIn = (): string => {
  setAuthCookie({ access_token: faker.string.alphanumeric(40), token_type: 'Bearer', expires_in: 3600 })
  return getAuthCookieAuthorization() as string
}

const newTokens = () => ({
  access_token: faker.string.alphanumeric(40),
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read',
  refresh_token: faker.string.alphanumeric(43),
  refresh_expires_in: REFRESH_WINDOW_SECONDS,
})

const signInWithRefreshToken = (): string => {
  setAuthCookie(newTokens())
  return getAuthCookieAuthorization() as string
}

const answerWith = (path: string, status: number, body: object) =>
  server.use(http.post(`${HYPERNATIVE_API_BASE_URL}${path}`, () => HttpResponse.json(body, { status })))

const answerRefreshWith = (status: number, body: object) => {
  let requests = 0
  server.use(
    http.post(`${HYPERNATIVE_API_BASE_URL}/oauth/token`, () => {
      requests += 1
      return HttpResponse.json(body, { status })
    }),
  )
  return () => requests
}

const refreshSettled = async (store: Store) => {
  await waitFor(() => {
    const mutations = Object.values(store.getState()[hypernativeApi.reducerPath].mutations)
    expect(mutations.some((mutation) => mutation?.status === 'fulfilled' || mutation?.status === 'rejected')).toBe(true)
  })
  // The listener carries on after the refresh request settles
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('hnSessionListener', () => {
  afterEach(() => clearAuthCookie())

  it.each(ENDPOINTS)('signs out and marks the session rejected when %s answers 1038', async (_label, path, call) => {
    const store = makeStore()
    const token = signIn()
    answerWith(path, 401, RECONNECT_REQUIRED)

    await call(store, token)

    expect(getAuthCookieAuthorization()).toBeUndefined()
    expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(token)
  })

  it('keeps a newer session when a 1038 answers a token that was already replaced', async () => {
    const store = makeStore()
    const replacedToken = `Bearer ${faker.string.alphanumeric(40)}`
    const currentToken = signIn()
    answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)

    await assessTransaction(store, replacedToken)

    expect(getAuthCookieAuthorization()).toBe(currentToken)
    expect(selectRejectedHypernativeAuthorization(store.getState())).toBeUndefined()
  })

  it('keeps the session when the API refuses the request for another reason', async () => {
    const store = makeStore()
    const token = signIn()
    answerWith('/safe/transaction/assessment', 403, { success: false, data: null, error: 'Forbidden', errorCode: 1027 })

    await assessTransaction(store, token)

    expect(getAuthCookieAuthorization()).toBe(token)
    expect(selectRejectedHypernativeAuthorization(store.getState())).toBeUndefined()
  })

  describe('with a refresh token', () => {
    it.each(ENDPOINTS)('refreshes instead of signing out when %s answers 1038', async (_label, path, call) => {
      const store = makeStore()
      const token = signInWithRefreshToken()
      const refreshed = newTokens()
      answerWith(path, 401, RECONNECT_REQUIRED)
      const refreshRequests = answerRefreshWith(200, { data: refreshed })

      await call(store, token)

      await waitFor(() => expect(getAuthCookieAuthorization()).toBe(`Bearer ${refreshed.access_token}`))
      expect(refreshRequests()).toBe(1)
      expect(selectRejectedHypernativeAuthorization(store.getState())).toBeUndefined()
    })

    it('signs out when the refresh is refused', async () => {
      const store = makeStore()
      const token = signInWithRefreshToken()
      answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
      answerRefreshWith(400, INVALID_GRANT)

      await assessTransaction(store, token)

      await waitFor(() => expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(token))
      expect(getAuthCookieAuthorization()).toBeUndefined()
    })

    it('signs out without another refresh when the refreshed token is rejected too', async () => {
      const store = makeStore()
      const token = signInWithRefreshToken()
      const refreshed = newTokens()
      const refreshedToken = `Bearer ${refreshed.access_token}`
      answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
      const refreshRequests = answerRefreshWith(200, { data: refreshed })

      await assessTransaction(store, token)
      await waitFor(() => expect(getAuthCookieAuthorization()).toBe(refreshedToken))
      await assessTransaction(store, refreshedToken)

      expect(refreshRequests()).toBe(1)
      expect(getAuthCookieAuthorization()).toBeUndefined()
      expect(selectRejectedHypernativeAuthorization(store.getState())).toBe(refreshedToken)
    })

    it('keeps the session when the refresh fails with a server error', async () => {
      const store = makeStore()
      const token = signInWithRefreshToken()
      answerWith('/safe/transaction/assessment', 401, RECONNECT_REQUIRED)
      const refreshRequests = answerRefreshWith(500, {})

      await assessTransaction(store, token)
      await refreshSettled(store)

      expect(refreshRequests()).toBe(1)
      expect(getAuthCookieAuthorization()).toBe(token)
      expect(selectRejectedHypernativeAuthorization(store.getState())).toBeUndefined()
    })
  })
})
