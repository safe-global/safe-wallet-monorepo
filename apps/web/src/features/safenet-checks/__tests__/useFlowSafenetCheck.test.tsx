import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo')

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

const renderInFlow = (flow: Partial<TxFlowContextType>, enabled?: boolean) =>
  renderHook(() => useFlowSafenetCheck(enabled), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <TxFlowContext.Provider value={{ ...initialContext, ...flow }}>{children}</TxFlowContext.Provider>
    ),
  })

describe('useFlowSafenetCheck', () => {
  const safe = extendedSafeInfoBuilder().build()
  const safeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' })
  const txId = `multisig_${safe.address.value}_${safeTxHash}`
  const execution = multisigExecutionDetailsBuilder().with({ safeTxHash }).build()
  const txDetails = transactionDetailsBuilder().with({ txId, detailedExecutionInfo: execution }).build()
  const target = { chainId: safe.chainId, safeAddress: safe.address.value }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafenetCheck.mockReturnValue(buildCheckView())
    mockUseSafeInfo.mockReturnValue({
      safe,
      safeAddress: safe.address.value,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  it('reads the check once the proposed transaction has a submission time', () => {
    const { result } = renderInFlow({ txId, txDetails })

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(safeTxHash, execution.submittedAt, target)
    expect(result.current).toMatchObject({ safeTxHash, submittedAt: execution.submittedAt })
  })

  it('does not read before the transaction details arrive', () => {
    renderInFlow({ txId })

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(undefined, undefined, target)
  })

  it('does not read when disabled', () => {
    renderInFlow({ txId, txDetails }, false)

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(undefined, execution.submittedAt, target)
  })
})
