import { render, screen } from '@/tests/test-utils'
import SafeShieldWidget from '../index'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { useSafeShield } from '../SafeShieldContext'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import { useIsHypernativeEligible } from '@/features/hypernative/hooks/useIsHypernativeEligible'
import { useCheckSimulation } from '../hooks/useCheckSimulation'

jest.mock('../SafeShieldContext')
jest.mock('@/features/hypernative/hooks/useHypernativeOAuth')
jest.mock('@/features/hypernative/hooks/useIsHypernativeEligible')
jest.mock('../hooks/useCheckSimulation')

const mockUseSafeShield = useSafeShield as jest.MockedFunction<typeof useSafeShield>
const mockUseHypernativeOAuth = useHypernativeOAuth as jest.MockedFunction<typeof useHypernativeOAuth>
const mockUseIsHypernativeEligible = useIsHypernativeEligible as jest.MockedFunction<typeof useIsHypernativeEligible>
const mockUseCheckSimulation = useCheckSimulation as jest.MockedFunction<typeof useCheckSimulation>

const emptyRecipient: AsyncResult<RecipientAnalysisResults> = [{}, undefined, false]
const emptyContract: AsyncResult<ContractAnalysisResults> = [{}, undefined, false]
const emptyThreat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]

describe('SafeShieldWidget', () => {
  beforeEach(() => {
    mockUseSafeShield.mockReturnValue({
      recipient: emptyRecipient,
      contract: emptyContract,
      threat: emptyThreat,
      safeTx: undefined,
      needsRiskConfirmation: false,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
      setRecipientAddresses: jest.fn(),
      setSafeTx: jest.fn(),
    })
    mockUseHypernativeOAuth.mockReturnValue({
      isAuthenticated: false,
      isTokenExpired: false,
      initiateLogin: jest.fn(),
      logout: jest.fn(),
    })
    mockUseIsHypernativeEligible.mockReturnValue({
      isHypernativeEligible: false,
      loading: false,
    })
    mockUseCheckSimulation.mockReturnValue({ hasSimulationError: false })
  })

  it('does not show Hypernative info when Safe is ineligible', () => {
    render(<SafeShieldWidget />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
    expect(screen.queryByText('Log in to Hypernative to view the full analysis.')).not.toBeInTheDocument()
  })

  it('shows Hypernative login CTA when eligible and not authenticated', () => {
    mockUseIsHypernativeEligible.mockReturnValue({ isHypernativeEligible: true, loading: false })

    render(<SafeShieldWidget />)

    expect(screen.getByText('Hypernative Guardian is active')).toBeInTheDocument()
    expect(screen.getByText('Log in to Hypernative to view the full analysis.')).toBeInTheDocument()
  })

  it('does not show Hypernative info while eligibility is loading', () => {
    mockUseIsHypernativeEligible.mockReturnValue({ isHypernativeEligible: true, loading: true })

    render(<SafeShieldWidget />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
  })
})
