import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { getAddress } from 'ethers'
import { Methods, RPC_CALLS, type SDKMessageEvent } from '@safe-global/safe-apps-sdk'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { transactionBuilderSafeApp } from '@safe-global/test/msw/mockSafeApps'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { balancesBuilder } from '@/tests/builders/balances'
import { initialState as initialSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { SafeAppsTxFlow } from '@/components/tx-flow/flows'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import type AppCommunicator from '@/services/safe-apps/AppCommunicator'
import { useCustomAppCommunicator } from '../useCustomAppCommunicator'

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@/hooks/useBalances')
jest.mock('@/services/analytics')
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockUseBalances = jest.requireMock('@/hooks/useBalances').default as jest.Mock

const APP = transactionBuilderSafeApp
const APP_ORIGIN = new URL(APP.url).origin
const RPC_URL = 'https://rpc.example.com'
const BALANCES_URL = `${GATEWAY_URL}/v1/chains/1/safes/:safeAddress/balances/:fiatCode`

type JsonRpcRequest = { id: number; method: string }
type SdkReply = { id: string; success: boolean; data?: unknown; error?: string }

type SetupOptions = {
  deployed?: boolean
  features?: FEATURES[]
  tokenList?: TOKEN_LISTS
}

const buildChain = (features: FEATURES[]): Chain =>
  chainBuilder()
    .with({ chainId: '1', features, rpcUri: { authentication: 'NO_AUTHENTICATION', value: RPC_URL } })
    .build()

const setup = ({ deployed = true, features = [], tokenList = TOKEN_LISTS.TRUSTED }: SetupOptions = {}) => {
  const safe = extendedSafeInfoBuilder()
    .with({ chainId: '1', deployed, implementation: addressExBuilder().build() })
    .build()
  const loadedBalances = balancesBuilder().build()
  mockUseBalances.mockReturnValue({ balances: loadedBalances, loaded: true, loading: false })

  const postMessage = jest.fn()
  const iframeRef = { current: { contentWindow: { postMessage } } as unknown as HTMLIFrameElement }
  const setTxFlow = jest.fn<void, Parameters<TxModalContextType['setTxFlow']>>()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      {children}
    </TxModalContext.Provider>
  )

  const { result } = renderHook(() => useCustomAppCommunicator(iframeRef, APP, buildChain(features)), {
    wrapper,
    initialReduxState: {
      safeInfo: { loading: false, loaded: true, data: safe },
      settings: { ...initialSettings, tokenList },
    },
  })

  const lastReply = (): SdkReply => postMessage.mock.lastCall?.[0]

  const request = async (method: Methods, params: unknown, id = faker.string.uuid()): Promise<SdkReply> => {
    const communicator = await waitFor(() => {
      expect(result.current).toBeDefined()
      return result.current as AppCommunicator
    })
    const message = {
      origin: APP_ORIGIN,
      source: iframeRef.current.contentWindow,
      data: { id, method, params, env: { sdkVersion: '9.1.0' } },
    } as SDKMessageEvent

    await act(() => communicator.handleIncomingMessage(message))
    return lastReply()
  }

  return { safe, loadedBalances, setTxFlow, request, lastReply }
}

const recordBalancesRequests = (response: () => Response) => {
  const urls: URL[] = []
  server.use(
    http.get(BALANCES_URL, ({ request }) => {
      urls.push(new URL(request.url))
      return response()
    }),
  )
  return urls
}

const serveRpc = (results: Record<string, unknown>) => {
  const answer = ({ id, method }: JsonRpcRequest) =>
    method in results
      ? { jsonrpc: '2.0', id, result: results[method] }
      : { jsonrpc: '2.0', id, error: { code: -32601, message: `${method} is not supported` } }

  server.use(
    http.post(RPC_URL, async ({ request }) => {
      const body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
      return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
    }),
  )
}

describe('useCustomAppCommunicator', () => {
  beforeEach(() => {
    server.use(http.get(`${GATEWAY_URL}/v2/chains/1/delegates`, () => HttpResponse.json({ count: 0, results: [] })))
  })

  describe('getSafeBalances', () => {
    it('answers a deployed Safe with the CGW balances, without spam tokens', async () => {
      const cgwBalances: Balances = balancesBuilder().build()
      const requests = recordBalancesRequests(() => HttpResponse.json(cgwBalances))
      const { safe, request } = setup()

      const reply = await request(Methods.getSafeBalances, { currency: 'eur' })

      expect(reply).toMatchObject({ success: true, data: cgwBalances })
      expect(requests).toHaveLength(1)
      expect(requests[0].pathname).toContain(`/safes/${safe.address.value}/balances/eur`)
      expect(requests[0].searchParams.get('exclude_spam')).toBe('true')
    })

    it.each([
      { tokenList: TOKEN_LISTS.TRUSTED, features: [FEATURES.DEFAULT_TOKENLIST], trusted: 'true' },
      { tokenList: TOKEN_LISTS.TRUSTED, features: [], trusted: 'false' },
      { tokenList: TOKEN_LISTS.ALL, features: [FEATURES.DEFAULT_TOKENLIST], trusted: 'false' },
    ])(
      'asks CGW for trusted=$trusted with token list $tokenList and chain features $features',
      async ({ tokenList, features, trusted }) => {
        const requests = recordBalancesRequests(() => HttpResponse.json(balancesBuilder().build()))
        const { request } = setup({ tokenList, features })

        await request(Methods.getSafeBalances, {})

        expect(requests[0].searchParams.get('trusted')).toBe(trusted)
      },
    )

    it('answers an undeployed Safe with the loaded balances and does not call CGW', async () => {
      const requests = recordBalancesRequests(() => HttpResponse.json(balancesBuilder().build()))
      const { loadedBalances, request } = setup({ deployed: false })

      const reply = await request(Methods.getSafeBalances, {})

      expect(reply).toMatchObject({ success: true, data: loadedBalances })
      expect(requests).toHaveLength(0)
    })

    it('answers with the loaded balances when CGW returns no data', async () => {
      recordBalancesRequests(() => HttpResponse.json(null, { status: 500 }))
      const { loadedBalances, request } = setup()

      const reply = await request(Methods.getSafeBalances, {})

      expect(reply).toMatchObject({ success: true, data: loadedBalances })
    })
  })

  describe('sendTransactions', () => {
    const recipient = faker.finance.ethereumAddress().toLowerCase()
    const contract = faker.finance.ethereumAddress().toLowerCase()
    const sentTxs = [
      { to: recipient, value: '0x10', data: '0x' },
      { to: contract, value: '', data: '' },
    ]

    const openedFlow = (setTxFlow: jest.Mock): ReactElement<ComponentProps<typeof SafeAppsTxFlow>> =>
      setTxFlow.mock.lastCall?.[0]

    it('opens the Safe Apps tx flow with the normalized transactions', async () => {
      const { setTxFlow, request } = setup()

      await request(Methods.sendTransactions, { txs: sentTxs, params: { safeTxGas: 0 } }, 'request-1')

      const flow = openedFlow(setTxFlow)
      expect(flow.type).toBe(SafeAppsTxFlow)
      expect(flow.props.data).toMatchObject({
        app: APP,
        requestId: 'request-1',
        params: { safeTxGas: 0 },
        txs: [
          { to: getAddress(recipient), value: '16', data: '0x' },
          { to: getAddress(contract), value: '0', data: '0x' },
        ],
      })
    })

    it('answers the app with the safeTxHash when the flow submits the transaction', async () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 })
      const { request, lastReply } = setup()
      await request(Methods.sendTransactions, { txs: sentTxs }, 'request-1')

      act(() => txDispatch(TxEvent.SAFE_APPS_REQUEST, { safeAppRequestId: 'request-1', safeTxHash }))

      expect(lastReply()).toMatchObject({ id: 'request-1', success: true, data: { safeTxHash } })
    })

    it('rejects the request when the user closes the flow', async () => {
      const { setTxFlow, request, lastReply } = setup()
      await request(Methods.sendTransactions, { txs: sentTxs }, 'request-1')
      const closeFlow = setTxFlow.mock.lastCall?.[1]

      act(() => closeFlow?.())

      expect(lastReply()).toMatchObject({ id: 'request-1', success: false, error: 'Transaction was rejected' })
    })
  })

  describe('rpcCall', () => {
    it('answers with the result from our RPC provider', async () => {
      const balance = '0x1b4'
      serveRpc({ eth_chainId: '0x1', eth_getBalance: balance })
      const { safe, request } = setup()

      const reply = await request(Methods.rpcCall, {
        call: RPC_CALLS.eth_getBalance,
        params: [safe.address.value, 'latest'],
      })

      expect(reply).toMatchObject({ success: true, data: balance })
    })

    it('stores the off-chain signing setting instead of calling the provider', async () => {
      serveRpc({})
      const { request } = setup()

      const reply = await request(Methods.rpcCall, {
        call: RPC_CALLS.safe_setSettings,
        params: [{ offChainSigning: false }],
      })

      expect(reply).toMatchObject({ success: true, data: { offChainSigning: false } })
    })

    it('fails the request when the provider rejects the method', async () => {
      serveRpc({ eth_chainId: '0x1' })
      const { request } = setup()

      const reply = await request(Methods.rpcCall, { call: 'eth_sign', params: [] })

      expect(reply).toMatchObject({ success: false, error: 'Request failed' })
    })
  })
})
