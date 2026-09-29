import { render, screen } from '@/tests/test-utils'
import SafeShieldWidget from '../index'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type {
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { useSafeShield } from '../SafeShieldContext'
import {
  useHypernativeOAuth,
  useIsHypernativeEligible,
  type HypernativeAuthStatus,
  type HypernativeEligibility,
} from '@/features/hypernative'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'
import { useCheckSimulation } from '../hooks/useCheckSimulation'

jest.mock('../SafeShieldContext')
jest.mock('@/features/hypernative', () => ({
  ...jest.requireActual('@/features/hypernative'),
  useHypernativeOAuth: jest.fn(),
  useIsHypernativeEligible: jest.fn(),
}))
jest.mock('../hooks/useCheckSimulation')
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(() => ({
    $isReady: true,
    $isDisabled: false,
    HnInfoCard: ({
      hypernativeAuth,
      showActiveStatus = true,
    }: {
      hypernativeAuth?: HypernativeAuthStatus
      showActiveStatus?: boolean
    }) => (hypernativeAuth && showActiveStatus ? <span>Hypernative Guardian is active</span> : null),
    HnCustomChecksCard: () => null,
    SafenetChecksSection: () => null,
  })),
}))

const mockUseSafeShield = useSafeShield as jest.MockedFunction<typeof useSafeShield>
const mockUseHypernativeOAuth = useHypernativeOAuth as jest.MockedFunction<typeof useHypernativeOAuth>
const mockUseIsHypernativeEligible = useIsHypernativeEligible as jest.MockedFunction<typeof useIsHypernativeEligible>
const mockUseCheckSimulation = useCheckSimulation as jest.MockedFunction<typeof useCheckSimulation>

const emptyRecipient: AsyncResult<RecipientAnalysisResults> = [{}, undefined, false]
const emptyContract: AsyncResult<ContractAnalysisResults> = [{}, undefined, false]
const emptyThreat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]
const emptyDeadlock: AsyncResult<DeadlockAnalysisResults> = [undefined, undefined, false]

const makeEligibility = (overrides: Partial<HypernativeEligibility> = {}): HypernativeEligibility => ({
  isHypernativeEligible: false,
  isHypernativeGuard: false,
  isAllowlistedSafe: false,
  loading: false,
  ...overrides,
})
const guardEligibility = makeEligibility({ isHypernativeEligible: true, isHypernativeGuard: true })

describe('SafeShieldWidget', () => {
  beforeEach(() => {
    mockUseSafeShield.mockReturnValue({
      recipient: emptyRecipient,
      contract: emptyContract,
      threat: emptyThreat,
      deadlock: emptyDeadlock,
      safeTx: undefined,
      needsRiskConfirmation: false,
      isRiskConfirmed: false,
      setIsRiskConfirmed: jest.fn(),
      setRecipientAddresses: jest.fn(),
      setPoisoningAddresses: jest.fn(),
      setSafeTx: jest.fn(),
      safeAnalysis: null,
      addToTrustedList: jest.fn(),
      hasProFeatures: true,
      isSafePro: true,
    })
    mockUseHypernativeOAuth.mockReturnValue(hypernativeAuthStatusBuilder().build())
    mockUseIsHypernativeEligible.mockReturnValue(makeEligibility())
    mockUseCheckSimulation.mockReturnValue({ hasSimulationError: false, isSimulationSuccess: false })
  })

  it('shows neither the guardian status nor the Hypernative login when the Safe is not eligible', () => {
    render(<SafeShieldWidget />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('hypernative-login-line')).not.toBeInTheDocument()
  })

  it('shows the guardian status and the Hypernative login when the Safe has the guard', () => {
    mockUseIsHypernativeEligible.mockReturnValue(guardEligibility)

    render(<SafeShieldWidget />)

    expect(screen.getByText('Hypernative Guardian is active')).toBeInTheDocument()
    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
  })

  it('shows the Hypernative login without the guardian status when the Safe is allowlisted only', () => {
    mockUseIsHypernativeEligible.mockReturnValue(
      makeEligibility({ isHypernativeEligible: true, isAllowlistedSafe: true }),
    )

    render(<SafeShieldWidget />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
  })

  it.each([
    { hasProFeatures: true, isSafePro: true },
    { hasProFeatures: false, isSafePro: true },
    { hasProFeatures: true, isSafePro: false },
  ])(
    'offers the Hypernative login to an eligible Safe with or without Safe Pro (%o)',
    ({ hasProFeatures, isSafePro }) => {
      mockUseSafeShield.mockReturnValue({ ...mockUseSafeShield(), hasProFeatures, isSafePro })
      mockUseIsHypernativeEligible.mockReturnValue(guardEligibility)

      render(<SafeShieldWidget />)

      expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
    },
  )

  it('shows neither the guardian status nor the Hypernative login while eligibility is loading', () => {
    mockUseIsHypernativeEligible.mockReturnValue(
      makeEligibility({ isHypernativeEligible: true, isHypernativeGuard: true, loading: true }),
    )

    render(<SafeShieldWidget />)

    expect(screen.queryByText('Hypernative Guardian is active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('hypernative-login-line')).not.toBeInTheDocument()
  })

  it('hides the Hypernative login once the user is authenticated, keeping the guardian status', () => {
    mockUseHypernativeOAuth.mockReturnValue(hypernativeAuthStatusBuilder().with({ isAuthenticated: true }).build())
    mockUseIsHypernativeEligible.mockReturnValue(guardEligibility)

    render(<SafeShieldWidget />)

    expect(screen.getByText('Hypernative Guardian is active')).toBeInTheDocument()
    expect(screen.queryByTestId('hypernative-login-line')).not.toBeInTheDocument()
  })

  it('offers the Hypernative login again when the token expired', () => {
    mockUseHypernativeOAuth.mockReturnValue(
      hypernativeAuthStatusBuilder().with({ isAuthenticated: true, isTokenExpired: true }).build(),
    )
    mockUseIsHypernativeEligible.mockReturnValue(guardEligibility)

    render(<SafeShieldWidget />)

    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
  })
})
