import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const mockUseSafenetCheck = jest.mocked(useSafenetCheck)

const renderInFlow = (flow: Partial<TxFlowContextType>, enabled?: boolean) =>
  renderHook(() => useFlowSafenetCheck(enabled), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <TxFlowContext.Provider value={{ ...initialContext, ...flow }}>{children}</TxFlowContext.Provider>
    ),
  })

describe('useFlowSafenetCheck', () => {
  const safeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' })
  const txId = `multisig_${faker.finance.ethereumAddress()}_${safeTxHash}`
  const execution = multisigExecutionDetailsBuilder().with({ safeTxHash }).build()
  const txDetails = transactionDetailsBuilder().with({ txId, detailedExecutionInfo: execution }).build()

  beforeEach(() => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())
  })

  it('reads the check once the proposed transaction has a submission time', () => {
    renderInFlow({ txId, txDetails })

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(safeTxHash, execution.submittedAt, expect.anything())
  })

  it('does not read before the transaction details arrive', () => {
    renderInFlow({ txId })

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(undefined, undefined, expect.anything())
  })

  it('does not read when disabled', () => {
    renderInFlow({ txId, txDetails }, false)

    expect(mockUseSafenetCheck).toHaveBeenLastCalledWith(undefined, execution.submittedAt, expect.anything())
  })
})
