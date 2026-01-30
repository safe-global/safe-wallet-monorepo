import { render, screen } from '@/tests/test-utils'
import { HnCustomChecksCard } from '../index'
import type { ThreatAnalysisResults, ThreatAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { HypernativeAuthStatus } from '@/features/hypernative'

// Mock HnAnalysisGroupCard
jest.mock('../../HnAnalysisGroupCard', () => ({
  HnAnalysisGroupCard: jest.fn(({ children, delay, highlightedSeverity, analyticsEvent, 'data-testid': testId }) => (
    <div data-testid={testId} data-delay={delay} data-severity={highlightedSeverity} data-analytics={analyticsEvent}>
      HnAnalysisGroupCard
      {children}
    </div>
  )),
}))

// Mock AnalysisGroupCardDisabled
jest.mock('@/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled', () => ({
  AnalysisGroupCardDisabled: jest.fn(({ children, 'data-testid': testId }) => (
    <div data-testid={testId}>AnalysisGroupCardDisabled: {children}</div>
  )),
}))

describe('HnCustomChecksCard', () => {
  const createCustomCheckResult = (overrides?: Partial<ThreatAnalysisResult>): ThreatAnalysisResult =>
    ({
      severity: Severity.WARN,
      type: ThreatStatus.HYPERNATIVE_GUARD,
      title: 'Custom check warning',
      description: 'This is a custom check warning',
      ...overrides,
    }) as ThreatAnalysisResult

  const createThreatResults = (customChecks?: ThreatAnalysisResult[]): ThreatAnalysisResults => {
    return {
      CUSTOM_CHECKS: customChecks,
    }
  }

  const createAuthenticatedAuth = (overrides?: Partial<HypernativeAuthStatus>): HypernativeAuthStatus => ({
    isAuthenticated: true,
    isTokenExpired: false,
    initiateLogin: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  })

  describe('when Hypernative authentication is required', () => {
    it('should render disabled card when hypernativeAuth is defined but not authenticated', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        createThreatResults([createCustomCheckResult()]),
        undefined,
        false,
      ]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: false })

      render(<HnCustomChecksCard threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCardDisabled: Custom checks')).toBeInTheDocument()
      expect(screen.queryByText('HnAnalysisGroupCard')).not.toBeInTheDocument()
    })

    it('should render disabled card when hypernativeAuth is defined and token is expired', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        createThreatResults([createCustomCheckResult()]),
        undefined,
        false,
      ]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: true, isTokenExpired: true })

      render(<HnCustomChecksCard threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCardDisabled: Custom checks')).toBeInTheDocument()
      expect(screen.queryByText('HnAnalysisGroupCard')).not.toBeInTheDocument()
    })

    it('should render disabled card when hypernativeAuth is defined, authenticated but token expired', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        createThreatResults([createCustomCheckResult()]),
        undefined,
        false,
      ]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: true, isTokenExpired: true })

      render(<HnCustomChecksCard threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCardDisabled: Custom checks')).toBeInTheDocument()
    })
  })

  describe('when Hypernative authentication is not required', () => {
    it('should return null when hypernativeAuth is undefined and there are no custom checks', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when threatResults is undefined', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when CUSTOM_CHECKS is undefined', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [{}, undefined, false]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when CUSTOM_CHECKS is empty array', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [{ CUSTOM_CHECKS: [] }, undefined, false]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render HnAnalysisGroupCard when there are custom checks and hypernativeAuth is undefined', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]

      render(<HnCustomChecksCard threat={threat} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('HnAnalysisGroupCard')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCardDisabled')).not.toBeInTheDocument()
    })

    it('should render HnAnalysisGroupCard when there are custom checks and hypernativeAuth is authenticated', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: true, isTokenExpired: false })

      render(<HnCustomChecksCard threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('HnAnalysisGroupCard')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCardDisabled')).not.toBeInTheDocument()
    })
  })

  describe('props forwarding', () => {
    it('should pass delay prop to HnAnalysisGroupCard', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]
      const delay = 1000

      render(<HnCustomChecksCard threat={threat} delay={delay} />)

      const card = screen.getByTestId('custom-checks-analysis-group-card')
      expect(card).toHaveAttribute('data-delay', delay.toString())
    })

    it('should pass highlightedSeverity prop to HnAnalysisGroupCard', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]
      const highlightedSeverity = Severity.CRITICAL

      render(<HnCustomChecksCard threat={threat} highlightedSeverity={highlightedSeverity} />)

      const card = screen.getByTestId('custom-checks-analysis-group-card')
      expect(card).toHaveAttribute('data-severity', highlightedSeverity)
    })

    it('should pass analyticsEvent prop to HnAnalysisGroupCard', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]

      render(<HnCustomChecksCard threat={threat} />)

      const card = screen.getByTestId('custom-checks-analysis-group-card')
      expect(card).toHaveAttribute('data-analytics')
      const analyticsValue = card.getAttribute('data-analytics')
      expect(analyticsValue).toBeTruthy()
    })

    it('should pass custom checks data to HnAnalysisGroupCard', () => {
      const customChecks = [
        createCustomCheckResult({ title: 'First check' }),
        createCustomCheckResult({ title: 'Second check' }),
      ]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]

      render(<HnCustomChecksCard threat={threat} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle multiple custom checks', () => {
      const customChecks = [
        createCustomCheckResult({ title: 'Check 1', severity: Severity.WARN }),
        createCustomCheckResult({ title: 'Check 2', severity: Severity.CRITICAL }),
        createCustomCheckResult({ title: 'Check 3', severity: Severity.INFO }),
      ]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]

      render(<HnCustomChecksCard threat={threat} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
    })

    it('should handle custom checks with different severities', () => {
      const customChecks = [
        createCustomCheckResult({ severity: Severity.OK }),
        createCustomCheckResult({ severity: Severity.WARN }),
        createCustomCheckResult({ severity: Severity.CRITICAL }),
      ]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]

      render(<HnCustomChecksCard threat={threat} />)

      expect(screen.getByTestId('custom-checks-analysis-group-card')).toBeInTheDocument()
    })

    it('should handle loading state (threatResults is undefined but threat is loading)', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, true]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle error state', () => {
      const error = new Error('Failed to fetch')
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, error, false]

      const { container } = render(<HnCustomChecksCard threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should prioritize authentication check over custom checks existence', () => {
      const customChecks = [createCustomCheckResult()]
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(customChecks), undefined, false]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: false })

      render(<HnCustomChecksCard threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByText('AnalysisGroupCardDisabled: Custom checks')).toBeInTheDocument()
      expect(screen.queryByText('HnAnalysisGroupCard')).not.toBeInTheDocument()
    })
  })
})
