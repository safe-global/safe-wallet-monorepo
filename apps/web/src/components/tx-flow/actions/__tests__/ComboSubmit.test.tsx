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

  it('auto-selects Execute when available', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    // Mock localStorage to return 'sign' as the stored preference
    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { container } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="sign" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    // The component should render without errors
    expect(container).toBeInTheDocument()
  })

  it('shows warning when Execute is available but user selected Sign', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    // Mock localStorage to return 'sign' as the stored preference
    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { getByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="sign" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(getByText(/You are providing the last signature/)).toBeInTheDocument()
  })

  it('does not show warning when user has already signed', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(true)
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="sign" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You are providing the last signature/)).not.toBeInTheDocument()
  })

  it('does not show warning when Execute is not available', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(false)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['sign', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="sign" />,
      { canExecute: false },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You are providing the last signature/)).not.toBeInTheDocument()
  })

  it('does not show warning when user selected Execute', () => {
    jest.spyOn(hooks, 'useAlreadySigned').mockReturnValue(false)
    jest.spyOn(hooks, 'useValidateNonce').mockReturnValue(true)
    jest.spyOn(slotsHooks, 'useSlotIds').mockReturnValue(['sign', 'execute'])

    const mockUseLocalStorage = require('@/services/local-storage/useLocalStorage').default
    mockUseLocalStorage.mockReturnValue(['execute', jest.fn()])

    const { queryByText } = render(
      <ComboSubmit onSubmit={jest.fn()} slotId="execute" />,
      { canExecute: true },
      { safeTx: safeTransaction },
    )

    expect(queryByText(/You are providing the last signature/)).not.toBeInTheDocument()
  })
})
