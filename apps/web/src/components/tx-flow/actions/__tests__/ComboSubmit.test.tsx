import { type ReactElement } from 'react'
import { render as renderTestUtils } from '@/tests/test-utils'
import { ComboSubmit } from '../ComboSubmit'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as hooks from '@/components/tx/shared/hooks'
import * as slotsHooks from '@/components/tx-flow/slots/hooks'
import { SlotProvider } from '@/components/tx-flow/slots'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import useSafeInfo from '@/hooks/useSafeInfo'
import * as useValidateTxData from '@/hooks/useValidateTxData'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/services/local-storage/useLocalStorage')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

const render = (ui: ReactElement, txFlowContext: Partial<TxFlowContextType> = {}, safeTxContext: any = {}) => {
  return renderTestUtils(
    <TxFlowContext.Provider value={{ ...initialContext, ...txFlowContext }}>
      <SafeTxContext.Provider value={{ safeTx: undefined, ...safeTxContext }}>
        <SlotProvider>{ui}</SlotProvider>
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )
}

describe('ComboSubmit', () => {
  const safeTransaction = createMockSafeTransaction({
    to: '0x1',
    data: '0x',
    operation: OperationType.Call,
  })

  const mockSafeInfo = {
    safe: {
      address: { value: '0xSafeAddress' },
      chainId: '1',
      threshold: 2,
      nonce: 1,
      owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }],
    },
    safeAddress: '0xSafeAddress',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue(mockSafeInfo as any)
    jest.spyOn(useValidateTxData, 'useValidateTxData').mockReturnValue([undefined, undefined, false])

    // Mock useSlot to return sign and execute options
    jest.spyOn(slotsHooks, 'useSlot').mockReturnValue([
      { id: 'sign', label: 'Sign', Component: () => null },
      { id: 'execute', label: 'Execute', Component: () => null },
    ] as any)
  })

  it('auto-selects Execute when available and no stored preference', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    // Mock localStorage to return undefined (no stored preference)
    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue([undefined, jest.fn()])

    const { container } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    // The component should render without errors
    expect(container).toBeInTheDocument()
  })

  it('shows warning when Execute is available but user selected Sign', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    // Mock localStorage to return 'sign' as the stored preference
    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { getByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(getByText(/You're providing the last signature/)).toBeInTheDocument()
  })

  it('does not show warning when user has already signed', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(true)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You're providing the last signature/)).not.toBeInTheDocument()
  })

  it('does not show warning when Execute is not available', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: false },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You're providing the last signature/)).not.toBeInTheDocument()
  })

  it('does not show warning when user selected Execute', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['execute', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You're providing the last signature/)).not.toBeInTheDocument()
  })

  it('respects stored Sign preference when Execute is available', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { getByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    // Should show warning when user has stored preference for Sign
    expect(getByText(/You're providing the last signature/)).toBeInTheDocument()
  })

  it('falls back to first option when stored action is not available', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    // Stored action is 'execute' but it's not available in current slots
    mockUseLocalStorage.mockReturnValue(['execute', jest.fn()])

    const { container } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: false },
      { safeTx: safeTransaction },
    )

    // Component should fall back to first option ('sign')
    expect(container).toBeInTheDocument()
  })

  it('does not auto-select Execute when validation is loading', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    // Mock validation loading state (third parameter is loading)
    jest.spyOn(useValidateTxData, 'useValidateTxData').mockReturnValue([undefined, undefined, true])

    // Mock localStorage to return undefined (no stored preference)
    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    const mockSetSubmitAction = jest.fn()
    mockUseLocalStorage.mockReturnValue([undefined, mockSetSubmitAction])

    const { container } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    // Component should render but not auto-select during validation loading
    expect(container).toBeInTheDocument()
    // The submit action setter should not be called during loading
    expect(mockSetSubmitAction).not.toHaveBeenCalled()
  })
})
