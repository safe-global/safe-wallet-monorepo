import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { renderHook, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { useLoadFeature } from '@/features/__core__'
import type { PolicyConfiguration } from '@/features/policy-guard/types'
import { createTx } from '@/services/tx/tx-sender/create'
import { useBuildApplyAllowlistTransaction } from '../useBuildApplyAllowlistTransaction'

const { createApplyConfigurationTx } = jest.requireActual('@/features/policy-guard/services/policyGuardEncoders')

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender/create', () => ({ createTx: jest.fn() }))

const makeConfiguration = (): PolicyConfiguration => ({
  target: faker.finance.ethereumAddress(),
  selector: '0xa9059cbb',
  operation: OperationType.Call,
  policy: faker.finance.ethereumAddress(),
  data: '0x',
})

const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError } as unknown as SafeTxContextParams}>
    {children}
  </SafeTxContext.Provider>
)

describe('useBuildApplyAllowlistTransaction', () => {
  const guardAddress = faker.finance.ethereumAddress()
  const scope = { chainId: '11155111', safeAddress: faker.finance.ethereumAddress(), sdk: {} }
  const builtTx = { data: { to: guardAddress } }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeScope as jest.Mock).mockReturnValue(scope)
    ;(useLoadFeature as jest.Mock).mockReturnValue({ $isReady: true, createApplyConfigurationTx })
    ;(createTx as jest.Mock).mockResolvedValue(builtTx)
  })

  it('sets one applyConfiguration call to the guard with the stored configurations', async () => {
    const configurations = [makeConfiguration(), makeConfiguration()]
    renderHook(() => useBuildApplyAllowlistTransaction(guardAddress, configurations), { wrapper })

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(createTx).toHaveBeenCalledWith(createApplyConfigurationTx(guardAddress, configurations), undefined, scope)
  })

  it('waits for the Safe SDK before building', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ ...scope, sdk: undefined })
    renderHook(() => useBuildApplyAllowlistTransaction(guardAddress, [makeConfiguration()]), { wrapper })

    expect(createTx).not.toHaveBeenCalled()
  })

  it('reports a failed build as the transaction error', async () => {
    const error = new Error('Could not encode')
    ;(createTx as jest.Mock).mockRejectedValue(error)
    renderHook(() => useBuildApplyAllowlistTransaction(guardAddress, [makeConfiguration()]), { wrapper })

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(error))
    expect(setSafeTx).not.toHaveBeenCalledWith(builtTx)
  })
})
