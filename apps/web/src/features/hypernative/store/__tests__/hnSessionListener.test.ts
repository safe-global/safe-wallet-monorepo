import { faker } from '@faker-js/faker'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { clearAuthCookie, getAuthCookieAuthorization, setAuthCookie } from '../cookieStorage'
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

const signIn = (): string => {
  setAuthCookie({ access_token: faker.string.alphanumeric(40), token_type: 'Bearer', expires_in: 3600 })
  return getAuthCookieAuthorization() as string
}

const answerWith = (path: string, status: number, body: object) =>
  server.use(http.post(`${HYPERNATIVE_API_BASE_URL}${path}`, () => HttpResponse.json(body, { status })))

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
})
