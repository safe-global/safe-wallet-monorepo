import type { ReactElement } from 'react'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider } from '@/components/tx-flow/slots'
import RiskConfirmationSlot from '@/components/tx-flow/features/RiskConfirmation'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import { createSafeTx } from '@/tests/builders/safeTx'
import ReviewTransactionContent from '../ReviewTransactionContent'

const mockUseThreatAnalysis = jest.fn()

jest.mock('@/features/safe-shield/hooks', () => ({
  useRecipientAnalysis: jest.fn(() => undefined),
  useCounterpartyAnalysis: jest.fn(() => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
    deadlock: [undefined, undefined, false],
  })),
  useThreatAnalysis: () => mockUseThreatAnalysis(),
  useRecipientAnalysisWithPoisoning: jest.fn(() => [undefined, undefined, false]),
}))

jest.mock('@/features/safe-shield/hooks/useUntrustedSafeAnalysis', () => ({
  __esModule: true,
  default: () => ({ safeAnalysis: null, addToTrustedList: jest.fn() }),
}))

jest.mock('@/features/spaces', () => ({
  useSafeProAccess: () => ({ hasProFeatures: true, isSafePro: true, isLoading: false }),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

const renderReview = () => {
  const onSubmit = jest.fn()
  const view = renderWithUserEvent(
    <SlotProvider>
      <SafeTxContext.Provider value={{ safeTx: createSafeTx() } as SafeTxContextParams}>
        <SafeShieldProvider>
          <RiskConfirmationSlot />
          <ReviewTransactionContent onSubmit={onSubmit} />
        </SafeShieldProvider>
      </SafeTxContext.Provider>
    </SlotProvider>,
  )
  return { ...view, onSubmit }
}

describe('ReviewTransactionContent risk gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps Continue disabled for a critical threat until the user confirms the risk', async () => {
    mockUseThreatAnalysis.mockReturnValue(ThreatAnalysisBuilder.maliciousThreat())
    const { user, onSubmit } = renderReview()

    const riskConfirmation = await screen.findByTestId('risk-confirmation-checkbox')
    const continueButton = screen.getByTestId('continue-sign-btn')
    const checkbox = within(riskConfirmation).getByRole('checkbox')

    expect(checkbox).not.toBeChecked()
    expect(continueButton).toBeDisabled()

    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(continueButton).toBeEnabled()

    await user.click(continueButton)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('enables Continue without a risk confirmation when no threat is found', async () => {
    mockUseThreatAnalysis.mockReturnValue(ThreatAnalysisBuilder.noThreat())
    renderReview()

    expect(await screen.findByTestId('continue-sign-btn')).toBeEnabled()
    expect(screen.queryByTestId('risk-confirmation-checkbox')).not.toBeInTheDocument()
  })
})
