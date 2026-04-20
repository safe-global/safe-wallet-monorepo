import { renderHook } from '@/tests/test-utils'
import { type PropsWithChildren } from 'react'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SlotProvider, SlotName } from '@/components/tx-flow/slots'
import { useSlotIds } from '@/components/tx-flow/slots/hooks'
import ExecuteThroughRoleSlot from '../ExecuteThroughRole'
import SignSlot from '../Sign'
import ExecuteSlot from '../Execute'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn(() => true),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => null),
  useSigner: jest.fn(() => null),
}))

jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: jest.fn(() => false),
}))

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => false),
  useValidateNonce: jest.fn(() => true),
  useTxActions: jest.fn(() => ({ signTx: jest.fn(), executeTx: jest.fn() })),
  useIsExecutionLoop: jest.fn(() => false),
}))

const safeTx = createMockSafeTransaction({
  to: '0x1',
  data: '0x',
  operation: OperationType.Call,
})

const safeInfo = extendedSafeInfoBuilder().build()
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>

describe('ExecuteThroughRole slot registration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: { ...safeInfo, threshold: 2, nonce: 1 },
      safeAddress: safeInfo.address.value,
      safeLoading: false,
      safeLoaded: true,
      safeError: undefined,
    } as ReturnType<typeof useSafeInfo>)
    mockUseIsSafeOwner.mockReturnValue(false)
  })

  const createWrapper = (txFlowOverrides: Partial<TxFlowContextType> = {}) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <TxFlowContext.Provider value={{ ...initialContext, ...txFlowOverrides }}>
        <SafeTxContext.Provider value={{ safeTx } as any}>
          <SlotProvider>
            <ExecuteThroughRoleSlot />
            <SignSlot />
            <ExecuteSlot />
            {children}
          </SlotProvider>
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    )
    return Wrapper
  }

  it('registers ExecuteThroughRole in ComboSubmit slot when canExecuteThroughRole is true', () => {
    const { result } = renderHook(() => useSlotIds(SlotName.ComboSubmit), {
      wrapper: createWrapper({ canExecuteThroughRole: true }),
    })

    expect(result.current).toContain('executeThroughRole')
  })

  it('does not register ExecuteThroughRole when canExecuteThroughRole is false', () => {
    const { result } = renderHook(() => useSlotIds(SlotName.ComboSubmit), {
      wrapper: createWrapper({ canExecuteThroughRole: false }),
    })

    expect(result.current).not.toContain('executeThroughRole')
  })

  it('does not register ExecuteThroughRole when owner can execute normally', () => {
    mockUseIsSafeOwner.mockReturnValue(true)

    const { result } = renderHook(() => useSlotIds(SlotName.ComboSubmit), {
      wrapper: createWrapper({ canExecuteThroughRole: true, canExecute: true }),
    })

    expect(result.current).not.toContain('executeThroughRole')
  })

  it('registers ExecuteThroughRole for non-owner role members even when canExecute is true', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    const { result } = renderHook(() => useSlotIds(SlotName.ComboSubmit), {
      wrapper: createWrapper({ canExecuteThroughRole: true, canExecute: true }),
    })

    expect(result.current).toContain('executeThroughRole')
  })

  it('registers ExecuteThroughRole alongside Sign for non-owner role members', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    const { result } = renderHook(() => useSlotIds(SlotName.ComboSubmit), {
      wrapper: createWrapper({ canExecuteThroughRole: true, canExecute: false }),
    })

    expect(result.current).toContain('executeThroughRole')
    expect(result.current).toContain('sign')
  })

  it('does not register ExecuteThroughRole in Submit slot (must be in ComboSubmit)', () => {
    const { result } = renderHook(
      () => ({
        submitSlotIds: useSlotIds(SlotName.Submit),
        comboSlotIds: useSlotIds(SlotName.ComboSubmit),
      }),
      {
        wrapper: createWrapper({ canExecuteThroughRole: true }),
      },
    )

    // ExecuteThroughRole must be in ComboSubmit, not Submit
    expect(result.current.comboSlotIds).toContain('executeThroughRole')
    expect(result.current.submitSlotIds).not.toContain('executeThroughRole')
  })
})
