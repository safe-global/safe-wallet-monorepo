import { renderHook } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import { buildSafeScopeKey } from '@/components/tx-flow/safe-scope/utils'
import * as txSender from '@/services/tx/tx-sender'
import * as useWalletHooks from '@/hooks/wallets/useWallet'
import * as useOnboardHooks from '@/hooks/wallets/useOnboard'
import * as useChains from '@/hooks/useChains'
import { useTxActions } from '../hooks'

jest.mock('@/services/tx/tx-sender', () => ({
  ...jest.requireActual('@/services/tx/tx-sender'),
  dispatchTxProposal: jest.fn(),
  dispatchTxSigning: jest.fn(),
  dispatchTxRelay: jest.fn(),
}))

jest.mock('@/utils/wallets', () => ({
  ...jest.requireActual('@/utils/wallets'),
  isSmartContractWallet: jest.fn().mockResolvedValue(false),
}))

jest.mock('@/services/tx/executionPreChecks', () => ({
  runExecutionPreChecks: jest.fn().mockResolvedValue(undefined),
}))

const scopedSafe = extendedSafeInfoBuilder().build()
const scope = {
  chainId: scopedSafe.chainId,
  safeAddress: scopedSafe.address.value,
  scopeKey: buildSafeScopeKey(scopedSafe.chainId, scopedSafe.address.value),
  safe: scopedSafe,
  safeLoaded: true,
  safeLoading: false,
  sdk: { id: 'scoped' } as unknown as Safe,
}
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeScopeContext.Provider value={{ scope, setScope: jest.fn(), clearScope: jest.fn() }}>
    {children}
  </SafeScopeContext.Provider>
)

// Threshold pinned to 1 and a pre-signed tx so `executeTx`'s `isRelayed` branch skips
// `signRelayedTx` and goes straight to `dispatchTxRelay` — keeps the relay assertion
// independent of the random threshold on the shared `scopedSafe` fixture above.
const relaySafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()
const relayScope = {
  chainId: relaySafe.chainId,
  safeAddress: relaySafe.address.value,
  scopeKey: buildSafeScopeKey(relaySafe.chainId, relaySafe.address.value),
  safe: relaySafe,
  safeLoaded: true,
  safeLoading: false,
  sdk: { id: 'scoped-relay' } as unknown as Safe,
}
const relayWrapper = ({ children }: { children: ReactNode }) => (
  <SafeScopeContext.Provider value={{ scope: relayScope, setScope: jest.fn(), clearScope: jest.fn() }}>
    {children}
  </SafeScopeContext.Provider>
)

describe('useTxActions under a SafeScope', () => {
  beforeEach(() => {
    const provider = { request: jest.fn() }
    jest.spyOn(useWalletHooks, 'default').mockReturnValue({
      address: '0x0000000000000000000000000000000000000001',
      chainId: scopedSafe.chainId,
      provider,
    } as never)
    jest.spyOn(useWalletHooks, 'useSigner').mockReturnValue({
      address: '0x0000000000000000000000000000000000000001',
      chainId: scopedSafe.chainId,
      provider,
      isSafe: false,
    } as never)
    jest.spyOn(useOnboardHooks, 'default').mockReturnValue({} as never)
    jest
      .spyOn(useChains, 'useCurrentChain')
      .mockReturnValue(chainBuilder().with({ chainId: scopedSafe.chainId }).build())
    ;(txSender.dispatchTxSigning as jest.Mock).mockImplementation(async (tx) => tx)
    ;(txSender.dispatchTxProposal as jest.Mock).mockResolvedValue({ txId: 'multisig_0x_0x' })
    ;(txSender.dispatchTxRelay as jest.Mock).mockResolvedValue(undefined)
  })
  afterEach(() => jest.restoreAllMocks())

  it('signTx passes the scope to signing and proposal', async () => {
    const { result } = renderHook(() => useTxActions(), { wrapper })
    const safeTx = safeTxBuilder().build()
    await result.current.signTx(safeTx)

    expect(txSender.dispatchTxSigning).toHaveBeenCalledWith(expect.anything(), expect.anything(), undefined, scope)
    expect(txSender.dispatchTxProposal).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: scopedSafe.chainId, safeAddress: scopedSafe.address.value, scope }),
    )
  })

  it('proposeTx reads chainId/safeAddress from the scope target while its SafeState is still loading', async () => {
    const loadingScope = {
      chainId: '137',
      safeAddress: '0x0000000000000000000000000000000000000789',
      scopeKey: buildSafeScopeKey('137', '0x0000000000000000000000000000000000000789'),
      safe: undefined,
      safeLoaded: false,
      safeLoading: true,
    }
    const loadingWrapper = ({ children }: { children: ReactNode }) => (
      <SafeScopeContext.Provider value={{ scope: loadingScope, setScope: jest.fn(), clearScope: jest.fn() }}>
        {children}
      </SafeScopeContext.Provider>
    )

    const { result } = renderHook(() => useTxActions(), { wrapper: loadingWrapper })
    await result.current.proposeTx(safeTxBuilder().build())

    expect(txSender.dispatchTxProposal).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: loadingScope.chainId, safeAddress: loadingScope.safeAddress }),
    )
  })

  it('without a scope passes undefined (regression baseline)', async () => {
    const { result } = renderHook(() => useTxActions())
    await result.current.proposeTx(safeTxBuilder().build())
    expect(txSender.dispatchTxProposal).toHaveBeenCalledWith(expect.objectContaining({ scope: undefined }))
  })

  it('executeTx (relayed) passes the scope to dispatchTxRelay', async () => {
    jest
      .spyOn(useChains, 'useCurrentChain')
      .mockReturnValue(chainBuilder().with({ chainId: relaySafe.chainId }).build())

    const { result } = renderHook(() => useTxActions(), { wrapper: relayWrapper })
    const safeTx = safeTxBuilder().build()
    safeTx.addSignature({
      signer: '0x0000000000000000000000000000000000000001',
      data: '0x0001',
      staticPart: () => '',
      dynamicPart: () => '',
      isContractSignature: false,
    })

    await result.current.executeTx({ gasLimit: 100000 }, safeTx, 'multisig_0x1', undefined, true, true)

    expect(txSender.dispatchTxRelay).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'multisig_0x1',
      expect.anything(),
      100000,
      true,
      relayScope,
    )
  })
})
