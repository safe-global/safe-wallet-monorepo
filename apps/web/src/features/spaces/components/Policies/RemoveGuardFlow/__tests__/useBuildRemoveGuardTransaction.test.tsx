import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { buildGuardRemovalCleanupConfigurations } from '@/features/policy-guard/public/services/guardRemoval'
import { createRemoveGuardTxs } from '@/features/policy-guard/public/services/policyGuardEncoders'
import * as useChainsModule from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { useBuildRemoveGuardTransaction } from '../useBuildRemoveGuardTransaction'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))

const SAFE = faker.finance.ethereumAddress()
const GUARD = faker.finance.ethereumAddress()
const HANDLER = faker.finance.ethereumAddress()
const scope = { chainId: '11155111', safeAddress: SAFE, sdk: {} }
const builtTx = { data: { to: SAFE } }

const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError } as unknown as SafeTxContextParams}>
    {children}
  </SafeTxContext.Provider>
)

describe('useBuildRemoveGuardTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeScope as jest.Mock).mockReturnValue(scope)
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(true)
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue(builtTx)
  })

  it('should batch emptying both guard slots and setting the fallback handler back, when no clean-up is given', async () => {
    renderHook(() => useBuildRemoveGuardTransaction(GUARD, HANDLER), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(
      createRemoveGuardTxs({ safeAddress: SAFE, guardAddress: GUARD, fallbackHandler: HANDLER }),
      scope,
    )
  })

  it('should apply the clean-up last in the same batch, when it is given', async () => {
    const cleanup = buildGuardRemovalCleanupConfigurations('11155111', SAFE)
    renderHook(() => useBuildRemoveGuardTransaction(GUARD, HANDLER, cleanup), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(
      createRemoveGuardTxs({
        safeAddress: SAFE,
        guardAddress: GUARD,
        fallbackHandler: HANDLER,
        cleanupConfigurations: cleanup,
      }),
      scope,
    )
  })

  it('should not build, when the fallback handler to set back is not known yet', () => {
    renderHook(() => useBuildRemoveGuardTransaction(GUARD, undefined), { wrapper })

    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
  })

  it('should not build, when the Safe SDK is not ready', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, sdk: undefined })
    renderHook(() => useBuildRemoveGuardTransaction(GUARD, HANDLER), { wrapper })

    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
  })

  it('should report the failure, when the batch cannot be built', async () => {
    const error = new Error('Could not encode')
    ;(createMultiSendCallOnlyTx as jest.Mock).mockRejectedValue(error)
    renderHook(() => useBuildRemoveGuardTransaction(GUARD, HANDLER), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(error))
  })
})
