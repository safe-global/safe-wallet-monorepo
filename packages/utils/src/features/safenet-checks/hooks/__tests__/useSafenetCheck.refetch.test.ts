import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactNode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { Provider } from 'react-redux'
import { setupServer, type SetupServerApi } from 'msw/node'
import { safenetCheckApi } from '@safe-global/store/safenet/safenetCheckApi'
import { forgetAim } from '@safe-global/store/safenet/safenetAimRegistry'
import {
  CheckStatus,
  SAFENET_DEPLOYMENT,
  SafenetReader,
  getSafenetReader,
} from '@safe-global/utils/features/safenet-checks'
import { makeEndpoint, type RpcConfig } from '../../services/__tests__/rpcEndpoint'
import type { RawLog } from '../../utils/decodeLogs'
import { useSafenetCheck, type SafenetCheckView } from '../useSafenetCheck'

jest.mock('@safe-global/utils/features/safenet-checks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks'),
  getSafenetReader: jest.fn(),
}))

const mockedGetReader = getSafenetReader as jest.MockedFunction<typeof getSafenetReader>

type Capture = {
  label: string
  safeTxHash: string
  homeChainId: string
  safe: string
  timestampMs: number
  requestId: string
  proposal: { blockNumber: number }
  groupKey: { x: string; y: string } | null
  logs: RawLog[]
  requestState: { blockNumber: number; rawResult: string }
}

const aegis: { provenance: { oracle: string }; captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const APPROVED = aegis.captures.find((candidate) => candidate.label === 'approved-first')!
const IDENTITY = { safeTxHash: APPROVED.safeTxHash, chainId: APPROVED.homeChainId, safeAddress: APPROVED.safe }
const TARGET = { chainId: APPROVED.homeChainId, safeAddress: APPROVED.safe }

const RPC_URL = 'http://rpc.safenet.test/gnosis'
const BLOCK_SECONDS = 5
const HEAD = APPROVED.requestState.blockNumber
const NEXT_HEAD = HEAD + 100

const headTimestampFor = (head: number): number =>
  APPROVED.timestampMs / 1000 + (head - APPROVED.proposal.blockNumber) * BLOCK_SECONDS

let server: SetupServerApi | undefined
let stopListening: (() => void) | undefined

/**
 * A settled, verified approval: the hook has nothing to poll for, so the only
 * thing that can read again is the focus or mount refetch under test.
 */
const startSession = () => {
  const config: RpcConfig = {
    url: RPC_URL,
    head: HEAD,
    headTimestamp: headTimestampFor(HEAD),
    logs: APPROVED.logs,
    requests: { [APPROVED.requestId]: { raw: APPROVED.requestState.rawResult } },
    ...(APPROVED.groupKey ? { groupKey: APPROVED.groupKey } : {}),
  }
  server = setupServer(makeEndpoint(config).handler)
  server.listen({ onUnhandledRequest: 'error' })
  // A fresh reader per read: ethers shares identical requests for 250ms, which would hide a chain that moved.
  mockedGetReader.mockImplementation(
    () =>
      new SafenetReader({
        rpcUrls: [RPC_URL],
        chainId: '100',
        consensus: SAFENET_DEPLOYMENT.consensus,
        coordinator: SAFENET_DEPLOYMENT.coordinator,
        oracles: [aegis.provenance.oracle],
      }),
  )
  const store = configureStore({
    reducer: { [safenetCheckApi.reducerPath]: safenetCheckApi.reducer },
    middleware: (getDefault) => getDefault().concat(safenetCheckApi.middleware),
  })
  stopListening = setupListeners(store.dispatch)

  const wrapper = ({ children }: { children: ReactNode }) => {
    const props = { store, children }
    return createElement(Provider, props)
  }
  const mount = () => renderHook(() => useSafenetCheck(APPROVED.safeTxHash, APPROVED.timestampMs, TARGET), { wrapper })
  const moveChainHeadTo = (head: number): void => {
    config.head = head
    config.headTimestamp = headTimestampFor(head)
  }
  return { mount, moveChainHeadTo }
}

type MountedCheck = { result: { current: SafenetCheckView } }

const firstRead = async ({ result }: MountedCheck): Promise<void> => {
  await waitFor(() => expect(result.current.snapshot?.headBlock).toBe(String(HEAD)), { timeout: 4000 })
  await waitFor(() => expect(result.current.isFetching).toBe(false))
}

beforeEach(() => {
  forgetAim(IDENTITY)
})

afterEach(() => {
  cleanup()
  stopListening?.()
  stopListening = undefined
  server?.close()
  server = undefined
  jest.restoreAllMocks()
})

describe('the check subscription as a user sees it', () => {
  it('reads the chain again when the window regains focus while the check is mounted', async () => {
    const { mount, moveChainHeadTo } = startSession()
    const mounted = mount()
    await firstRead(mounted)
    expect(mounted.result.current.snapshot?.status).toBe(CheckStatus.BENIGN)

    moveChainHeadTo(NEXT_HEAD)
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => expect(mounted.result.current.snapshot?.headBlock).toBe(String(NEXT_HEAD)), { timeout: 4000 })
    expect(mounted.result.current.snapshot?.status).toBe(CheckStatus.BENIGN)
  })

  it('reads the chain again when the check is mounted over a snapshot that is still cached', async () => {
    const { mount, moveChainHeadTo } = startSession()
    const first = mount()
    await firstRead(first)
    first.unmount()

    moveChainHeadTo(NEXT_HEAD)
    const second = mount()

    expect(second.result.current.snapshot?.headBlock).toBe(String(HEAD))
    await waitFor(() => expect(second.result.current.snapshot?.headBlock).toBe(String(NEXT_HEAD)), { timeout: 4000 })
    expect(second.result.current.snapshot?.status).toBe(CheckStatus.BENIGN)
  })
})
