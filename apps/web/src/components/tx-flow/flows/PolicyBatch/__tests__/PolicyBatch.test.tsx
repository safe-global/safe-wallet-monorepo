import { render, waitFor } from '@/tests/test-utils'
import { useState, type ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import * as coreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as create from '@/services/tx/tx-sender/create'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { PolicyBatchReview } from '../index'

// Keep the review body trivial — we only care about the SafeTx build effect.
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>review{children}</div>,
}))

const TXS = [{ to: '0x2222222222222222222222222222222222222222', value: '0', data: '0x' }]
const FAKE_SAFE_TX = { data: {} } as unknown as SafeTransaction

type CapturedState = { tx?: SafeTransaction; err?: Error }

/** Minimal stateful SafeTxContext so we can observe what the review sets. */
const StatefulSafeTx = ({ onState, children }: { onState: (s: CapturedState) => void; children: ReactNode }) => {
  const [safeTx, setSafeTx] = useState<SafeTransaction>()
  const [safeTxError, setSafeTxError] = useState<Error>()
  onState({ tx: safeTx, err: safeTxError })
  return (
    <SafeTxContext.Provider value={{ safeTx, safeTxError, setSafeTx, setSafeTxError } as never}>
      {children}
    </SafeTxContext.Provider>
  )
}

const renderReview = (onState: (s: CapturedState) => void) =>
  render(
    <StatefulSafeTx onState={onState}>
      <TxFlowContext.Provider value={{ data: { txs: TXS } } as never}>
        <PolicyBatchReview onSubmit={jest.fn()} />
      </TxFlowContext.Provider>
    </StatefulSafeTx>,
  )

describe('PolicyBatchReview - SDK readiness gating', () => {
  afterEach(() => jest.restoreAllMocks())

  it('does NOT attempt to build the tx while the SDK is not initialized', () => {
    jest.spyOn(coreSDK, 'useSafeSDK').mockReturnValue(undefined)
    const createSpy = jest.spyOn(create, 'createMultiSendCallOnlyTx')

    renderReview(jest.fn())

    // The bug: it used to call this immediately and throw "SDK could not be
    // initialized". With the gate, it waits.
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('builds the tx once the SDK is ready', async () => {
    jest.spyOn(coreSDK, 'useSafeSDK').mockReturnValue({} as Safe)
    const createSpy = jest.spyOn(create, 'createMultiSendCallOnlyTx').mockResolvedValue(FAKE_SAFE_TX)

    const states: Array<{ tx?: SafeTransaction; err?: Error }> = []
    renderReview((s) => states.push(s))

    await waitFor(() => expect(createSpy).toHaveBeenCalledWith(TXS))
    await waitFor(() => expect(states.at(-1)?.tx).toBe(FAKE_SAFE_TX))
    expect(states.at(-1)?.err).toBeUndefined()
  })

  it('retries the build when the SDK becomes ready after mount (the reported bug)', async () => {
    // First render: no SDK. Rerender: SDK present.
    const sdkSpy = jest.spyOn(coreSDK, 'useSafeSDK').mockReturnValue(undefined)
    const createSpy = jest.spyOn(create, 'createMultiSendCallOnlyTx').mockResolvedValue(FAKE_SAFE_TX)

    const { rerender } = renderReview(jest.fn())
    expect(createSpy).not.toHaveBeenCalled()

    sdkSpy.mockReturnValue({} as Safe)
    rerender(
      <StatefulSafeTx onState={jest.fn()}>
        <TxFlowContext.Provider value={{ data: { txs: TXS } } as never}>
          <PolicyBatchReview onSubmit={jest.fn()} />
        </TxFlowContext.Provider>
      </StatefulSafeTx>,
    )

    await waitFor(() => expect(createSpy).toHaveBeenCalledWith(TXS))
  })
})
