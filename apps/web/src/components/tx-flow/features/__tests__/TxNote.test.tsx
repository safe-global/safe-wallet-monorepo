import type { ReactNode } from 'react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { renderHook } from '@/tests/test-utils'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useShouldRegisterSlot } from '../TxNote'

jest.mock('@/hooks/useIsSafeOwner')

const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>

const renderCondition = (ctx: Partial<TxFlowContextType>) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TxFlowContext.Provider value={ctx as TxFlowContextType}>{children}</TxFlowContext.Provider>
  )
  return renderHook(() => useShouldRegisterSlot(), { wrapper })
}

const txDetailsWithNote = { note: 'Monthly payroll' } as unknown as TransactionDetails

describe('tx-flow TxNote useShouldRegisterSlot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers the slot during creation regardless of ownership', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    const { result } = renderCondition({ isCreation: true, txDetails: undefined })

    expect(result.current).toBe(true)
  })

  it('registers the slot for a signer viewing a transaction with a note', () => {
    mockUseIsSafeOwner.mockReturnValue(true)

    const { result } = renderCondition({ isCreation: false, txDetails: txDetailsWithNote })

    expect(result.current).toBe(true)
  })

  it('does not register the slot for a non-signer viewing a transaction with a note', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    const { result } = renderCondition({ isCreation: false, txDetails: txDetailsWithNote })

    expect(result.current).toBe(false)
  })

  it('does not register the slot when there is no note', () => {
    mockUseIsSafeOwner.mockReturnValue(true)

    const { result } = renderCondition({ isCreation: false, txDetails: undefined })

    expect(result.current).toBe(false)
  })
})
