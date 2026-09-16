import { renderHook } from '@/tests/test-utils'
import { type PropsWithChildren } from 'react'
import { SlotProvider, SlotName } from '@/components/tx-flow/slots'
import { useSlotIds } from '@/components/tx-flow/slots/hooks'
import RiskConfirmationSlot from '../RiskConfirmation'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { useHasFeature } from '@/hooks/useChains'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn(() => false),
}))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShield: jest.fn(),
}))

const mockUseSafeShield = useSafeShield as jest.MockedFunction<typeof useSafeShield>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

const createWrapper = () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <SafeTxContext.Provider value={{ safeTx: undefined } as any}>
      <SlotProvider>
        <RiskConfirmationSlot />
        {children}
      </SlotProvider>
    </SafeTxContext.Provider>
  )
  return Wrapper
}

describe('RiskConfirmation slot registration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers the checkbox when risk confirmation is needed, regardless of chain feature flags', () => {
    // Submit buttons block on needsRiskConfirmation unconditionally, so the checkbox must not be
    // gated on a chain flag — otherwise submission can deadlock with no way to confirm.
    mockUseHasFeature.mockReturnValue(false)
    mockUseSafeShield.mockReturnValue({
      needsRiskConfirmation: true,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
    } as unknown as ReturnType<typeof useSafeShield>)

    const { result } = renderHook(() => useSlotIds(SlotName.Footer), {
      wrapper: createWrapper(),
    })

    expect(result.current).toContain('riskConfirmation')
  })

  it('does not register the checkbox when no risk confirmation is needed', () => {
    mockUseSafeShield.mockReturnValue({
      needsRiskConfirmation: false,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
    } as unknown as ReturnType<typeof useSafeShield>)

    const { result } = renderHook(() => useSlotIds(SlotName.Footer), {
      wrapper: createWrapper(),
    })

    expect(result.current).not.toContain('riskConfirmation')
  })
})
