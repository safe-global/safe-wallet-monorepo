import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { useLoadFeature } from '@/features/__core__'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import { useBuildRemoveGuardTransaction } from '../useBuildRemoveGuardTransaction'

const { createRemoveGuardTxs } = jest.requireActual('@/features/policy-guard/services/policyGuardEncoders')

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createMultiSendCallOnlyTx: jest.fn() }))

const SAFE = faker.finance.ethereumAddress()
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
    ;(useLoadFeature as jest.Mock).mockReturnValue({ $isReady: true, createRemoveGuardTxs })
    ;(createMultiSendCallOnlyTx as jest.Mock).mockResolvedValue(builtTx)
  })

  it('should batch setting both guard slots to zero, when the Safe SDK is ready', async () => {
    renderHook(() => useBuildRemoveGuardTransaction(), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(createMultiSendCallOnlyTx).toHaveBeenCalledWith(createRemoveGuardTxs(SAFE), scope)
  })

  it('should not build, when the Safe SDK is not ready', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, sdk: undefined })
    renderHook(() => useBuildRemoveGuardTransaction(), { wrapper })

    expect(createMultiSendCallOnlyTx).not.toHaveBeenCalled()
  })

  it('should report the failure, when the batch cannot be built', async () => {
    const error = new Error('Could not encode')
    ;(createMultiSendCallOnlyTx as jest.Mock).mockRejectedValue(error)
    renderHook(() => useBuildRemoveGuardTransaction(), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(error))
  })
})
