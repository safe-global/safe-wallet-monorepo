// SPDX-License-Identifier: FSL-1.1-MIT

import { renderHook } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { SafeScopeContext } from '@/components/tx-flow/safe-scope/context'
import * as txSender from '@/services/tx/tx-sender'
import * as useWalletHooks from '@/hooks/wallets/useWallet'
import * as useOnboardHooks from '@/hooks/wallets/useOnboard'
import { useTxActions } from '../hooks'

jest.mock('@/services/tx/tx-sender', () => ({
  ...jest.requireActual('@/services/tx/tx-sender'),
  dispatchTxProposal: jest.fn(),
  dispatchTxSigning: jest.fn(),
}))

jest.mock('@/utils/wallets', () => ({
  ...jest.requireActual('@/utils/wallets'),
  isSmartContractWallet: jest.fn().mockResolvedValue(false),
}))

const scopedSafe = extendedSafeInfoBuilder().build()
const scope = {
  chainId: scopedSafe.chainId,
  safeAddress: scopedSafe.address.value,
  scopeKey: `${scopedSafe.chainId}:${scopedSafe.address.value}`,
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
    ;(txSender.dispatchTxSigning as jest.Mock).mockImplementation(async (tx) => tx)
    ;(txSender.dispatchTxProposal as jest.Mock).mockResolvedValue({ txId: 'multisig_0x_0x' })
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

  it('without a scope passes undefined (regression baseline)', async () => {
    const { result } = renderHook(() => useTxActions())
    await result.current.proposeTx(safeTxBuilder().build())
    expect(txSender.dispatchTxProposal).toHaveBeenCalledWith(expect.objectContaining({ scope: undefined }))
  })
})
