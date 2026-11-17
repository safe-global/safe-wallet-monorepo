import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook, waitFor } from '@testing-library/react'
import { apiSliceWithChainsConfig, chainsAdapter, initialState } from '@safe-global/store/gateway/chains'
import { safenetCheckApi } from '@safe-global/store/safenet/safenetCheckApi'
import { safenetCheckSlice } from '@safe-global/store/safenet/safenetCheckSlice'
import { forgetAim } from '@safe-global/store/safenet/safenetAimRegistry'
import { chainBuilder } from '../../../../tests/builders/chains'
import { oracleResultEvent, requestCreatedEvent } from '../../builders'
import { getSafenetReader, type CheckReadResult, type SafenetReader } from '../../services/safenetReader'
import { CheckStatus } from '../../types'
import { useSafenetCheck } from '../useSafenetCheck'

jest.mock('../../services/safenetReader', () => ({
  ...jest.requireActual('../../services/safenetReader'),
  getSafenetReader: jest.fn(),
}))

const HASH_A = ('0x' + 'aa'.repeat(32)) as `0x${string}`
const HASH_B = ('0x' + 'bb'.repeat(32)) as `0x${string}`
const TARGET = { chainId: '100', safeAddress: '0x0000000000000000000000000000000000000abc' }

const fakeReader = { fetchCheckState: jest.fn(), verifyAttestation: jest.fn(), blockTimeMs: jest.fn() }

const read = (over: Partial<CheckReadResult>): CheckReadResult => ({
  safeTxHash: HASH_A,
  chainId: '100',
  events: [],
  headBlock: '100',
  requestId: null,
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  windowCoverage: 'heuristic',
  ...over,
})

const makeStore = () => {
  const store = configureStore({
    reducer: {
      [safenetCheckSlice.name]: safenetCheckSlice.reducer,
      [safenetCheckApi.reducerPath]: safenetCheckApi.reducer,
      [apiSliceWithChainsConfig.reducerPath]: apiSliceWithChainsConfig.reducer,
    },
    middleware: (getDefault) => getDefault().concat(safenetCheckApi.middleware, apiSliceWithChainsConfig.middleware),
  })
  const chain = chainBuilder()
    .with({ chainId: '100', rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.safe.global/100/' } })
    .build()
  store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryEntries([
      {
        endpointName: 'getChainsConfigV2',
        arg: 'WALLET_WEB',
        value: chainsAdapter.setAll(initialState, [chain]),
      },
    ]),
  )
  return store
}

const MALICIOUS_READ = read({ events: [oracleResultEvent({ approved: false })] })

beforeEach(() => {
  fakeReader.fetchCheckState.mockReset()
  fakeReader.blockTimeMs.mockResolvedValue(null)
  jest.mocked(getSafenetReader).mockReturnValue(fakeReader as unknown as SafenetReader)
  forgetAim({ safeTxHash: HASH_A, ...TARGET })
  forgetAim({ safeTxHash: HASH_B, ...TARGET })
})

const renderCheck = () => {
  const store = makeStore()
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(({ hash }) => useSafenetCheck(hash, null, TARGET), { initialProps: { hash: HASH_A }, wrapper })
}

describe('useSafenetCheck across transactions', () => {
  it('never shows the previous transaction’s verdict while the next one is read', async () => {
    const pendingB = Promise.withResolvers<CheckReadResult>()
    fakeReader.fetchCheckState.mockImplementation((hash: string) =>
      hash === HASH_A ? Promise.resolve(MALICIOUS_READ) : pendingB.promise,
    )
    const { result, rerender } = renderCheck()
    await waitFor(() => expect(result.current.status).toBe(CheckStatus.MALICIOUS))

    rerender({ hash: HASH_B })

    expect(result.current.snapshot).toBeUndefined()
    expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
    expect(result.current.isLoading).toBe(true)

    pendingB.resolve(
      read({
        safeTxHash: HASH_B,
        events: [requestCreatedEvent({ deadlineBlock: '1000' })],
        deadlineBlock: '1000',
      }),
    )
    await waitFor(() => expect(result.current.status).toBe(CheckStatus.IN_PROGRESS))
    expect(result.current.snapshot?.safeTxHash).toBe(HASH_B)
  })

  it('keeps the same transaction’s last snapshot, flagged stale, when a refetch fails', async () => {
    fakeReader.fetchCheckState.mockResolvedValueOnce(MALICIOUS_READ)
    const { result } = renderCheck()
    await waitFor(() => expect(result.current.status).toBe(CheckStatus.MALICIOUS))

    fakeReader.fetchCheckState.mockRejectedValue(new Error('rpc down'))
    act(() => result.current.refetch())

    await waitFor(() => expect(result.current.isStale).toBe(true))
    expect(result.current.snapshot?.status).toBe(CheckStatus.MALICIOUS)
    expect(result.current.status).toBe(CheckStatus.MALICIOUS)
  })
})
