import { render, screen } from '@/tests/test-utils'
import { ThreatAnalysis } from '../ThreatAnalysis'
import type { ThreatAnalysisResults, ThreatAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { Severity, ThreatStatus, CommonSharedStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { HypernativeAuthStatus } from '@/features/hypernative'

// Mock AnalysisGroupCard
jest.mock('../../AnalysisGroupCard', () => ({
  AnalysisGroupCard: jest.fn(
    ({ children, delay, highlightedSeverity, analyticsEvent, requestId, 'data-testid': testId }) => (
      <div
        data-testid={testId}
        data-delay={delay}
        data-severity={highlightedSeverity}
        data-analytics={analyticsEvent}
        data-request-id={requestId}
      >
        AnalysisGroupCard
        {children}
      </div>
    ),
  ),
}))

// Mock AnalysisGroupCardDisabled
jest.mock('../AnalysisGroupCardDisabled', () => ({
  AnalysisGroupCardDisabled: jest.fn(({ children, 'data-testid': testId }) => (
    <div data-testid={testId}>AnalysisGroupCardDisabled: {children}</div>
  )),
}))

// Mock analytics
jest.mock('@/services/analytics', () => ({
  ...(
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
  SAFE_SHIELD_EVENTS: {
    THREAT_ANALYZED: { action: 'Threat analyzed', category: 'safe-shield' },
  },
}))

// Mock useLoadFeature to provide HnAnalysisGroupCard
jest.mock('@/features/__core__', () => ({
  createFeatureHandle: jest.fn((name) => ({ name, __type: 'FeatureHandle' })),
  useLoadFeature: jest.fn(() => ({
    $isReady: true,
    $isDisabled: false,
    HnAnalysisGroupCard: jest.fn(
      ({ children, delay, highlightedSeverity, analyticsEvent, requestId, 'data-testid': testId }) => (
        <div
          data-testid={testId}
          data-delay={delay}
          data-severity={highlightedSeverity}
          data-analytics={analyticsEvent}
          data-request-id={requestId}
        >
          HnAnalysisGroupCard
          {children}
        </div>
      ),
    ),
  })),
}))

describe('ThreatAnalysis', () => {
  const createThreatResult = (overrides?: Partial<ThreatAnalysisResult>): ThreatAnalysisResult =>
    ({
      severity: Severity.WARN,
      type: ThreatStatus.HYPERNATIVE_GUARD,
      title: 'Threat detected',
      description: 'This is a threat',
      ...overrides,
    }) as ThreatAnalysisResult

  const createThreatResults = (overrides?: Partial<ThreatAnalysisResults>): ThreatAnalysisResults => {
    return {
      THREAT: [createThreatResult()],
      ...overrides,
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
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: false })

      render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCardDisabled: Threat analysis')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCard')).not.toBeInTheDocument()
    })

    it('should render disabled card when hypernativeAuth is defined and token is expired', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: true, isTokenExpired: true })

      render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCardDisabled: Threat analysis')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCard')).not.toBeInTheDocument()
    })

    it('should render disabled card even when threat results exist', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        createThreatResults({ THREAT: [createThreatResult({ severity: Severity.CRITICAL })] }),
        undefined,
        false,
      ]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: false })

      render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByText('AnalysisGroupCardDisabled: Threat analysis')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCard')).not.toBeInTheDocument()
    })
  })

  describe('when Hypernative authentication is not required', () => {
    it('should return null when threatResults is undefined', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when threatResults is empty object', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [{}, undefined, false]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when threatResults only contains BALANCE_CHANGE', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          BALANCE_CHANGE: [
            {
              asset: { type: 'NATIVE', symbol: 'ETH' },
              in: [{ value: '1000000000000000000' }],
              out: [],
            },
          ],
        },
        undefined,
        false,
      ]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when threatResults only contains CUSTOM_CHECKS', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          CUSTOM_CHECKS: [createThreatResult()],
        },
        undefined,
        false,
      ]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when threatResults only contains BALANCE_CHANGE and CUSTOM_CHECKS', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          BALANCE_CHANGE: [
            {
              asset: { type: 'NATIVE', symbol: 'ETH' },
              in: [{ value: '1000000000000000000' }],
              out: [],
            },
          ],
          CUSTOM_CHECKS: [createThreatResult()],
        },
        undefined,
        false,
      ]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render AnalysisGroupCard when THREAT exists and hypernativeAuth is undefined', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]

      render(<ThreatAnalysis threat={threat} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCard')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCardDisabled')).not.toBeInTheDocument()
    })

    it('should render HnAnalysisGroupCard when THREAT exists and hypernativeAuth is authenticated', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: true, isTokenExpired: false })

      render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('HnAnalysisGroupCard')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCardDisabled')).not.toBeInTheDocument()
    })

    it('should filter out BALANCE_CHANGE and CUSTOM_CHECKS from threatData', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          THREAT: [createThreatResult()],
          BALANCE_CHANGE: [
            {
              asset: { type: 'NATIVE', symbol: 'ETH' },
              in: [{ value: '1000000000000000000' }],
              out: [],
            },
          ],
          CUSTOM_CHECKS: [createThreatResult({ title: 'Custom check' })],
        },
        undefined,
        false,
      ]

      render(<ThreatAnalysis threat={threat} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
      expect(screen.getByText('AnalysisGroupCard')).toBeInTheDocument()
    })
  })

  describe('props forwarding', () => {
    it('should pass delay prop to AnalysisGroupCard', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]
      const delay = 2000

      render(<ThreatAnalysis threat={threat} delay={delay} />)

      const card = screen.getByTestId('threat-analysis-group-card')
      expect(card).toHaveAttribute('data-delay', delay.toString())
    })

    it('should pass highlightedSeverity prop to AnalysisGroupCard', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]
      const highlightedSeverity = Severity.CRITICAL

      render(<ThreatAnalysis threat={threat} highlightedSeverity={highlightedSeverity} />)

      const card = screen.getByTestId('threat-analysis-group-card')
      expect(card).toHaveAttribute('data-severity', highlightedSeverity)
    })

    it('should pass analyticsEvent prop to AnalysisGroupCard', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]

      render(<ThreatAnalysis threat={threat} />)

      const card = screen.getByTestId('threat-analysis-group-card')
      expect(card).toHaveAttribute('data-analytics')
      const analyticsValue = card.getAttribute('data-analytics')
      expect(analyticsValue).toBeTruthy()
    })

    it('should pass requestId prop to AnalysisGroupCard when present', () => {
      const requestId = 'test-request-id-123'
      const threat: AsyncResult<ThreatAnalysisResults> = [
        { ...createThreatResults(), request_id: requestId },
        undefined,
        false,
      ]

      render(<ThreatAnalysis threat={threat} />)

      const card = screen.getByTestId('threat-analysis-group-card')
      expect(card).toHaveAttribute('data-request-id', requestId)
    })

    it('should not pass requestId when it is undefined', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]

      render(<ThreatAnalysis threat={threat} />)

      const card = screen.getByTestId('threat-analysis-group-card')
      const requestId = card.getAttribute('data-request-id')
      expect(requestId).toBeNull()
    })
  })

  describe('threat data structure', () => {
    it('should wrap threat results in address key structure', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [createThreatResults(), undefined, false]

      render(<ThreatAnalysis threat={threat} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
    })

    it('should handle multiple threat results', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          THREAT: [
            createThreatResult({ title: 'First threat', severity: Severity.CRITICAL }),
            createThreatResult({ title: 'Second threat', severity: Severity.WARN }),
          ],
        },
        undefined,
        false,
      ]

      render(<ThreatAnalysis threat={threat} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
    })

    it('should handle threat results with COMMON status group', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          THREAT: [createThreatResult()],
          COMMON: [
            {
              severity: Severity.ERROR,
              type: CommonSharedStatus.FAILED,
              title: 'Analysis failed',
              description: 'Failed to analyze',
            },
          ],
        },
        undefined,
        false,
      ]

      render(<ThreatAnalysis threat={threat} />)

      expect(screen.getByTestId('threat-analysis-group-card')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle loading state (threatResults is undefined but threat is loading)', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, true]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle error state', () => {
      const error = new Error('Failed to fetch')
      const threat: AsyncResult<ThreatAnalysisResults> = [undefined, error, false]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })

    it('should prioritize authentication check over threat results existence', () => {
      const threat: AsyncResult<ThreatAnalysisResults> = [
        createThreatResults({ THREAT: [createThreatResult({ severity: Severity.CRITICAL })] }),
        undefined,
        false,
      ]
      const hypernativeAuth = createAuthenticatedAuth({ isAuthenticated: false })

      render(<ThreatAnalysis threat={threat} hypernativeAuth={hypernativeAuth} />)

      // Should show disabled card even though threat results exist
      expect(screen.getByText('AnalysisGroupCardDisabled: Threat analysis')).toBeInTheDocument()
      expect(screen.queryByText('AnalysisGroupCard')).not.toBeInTheDocument()
    })

    it('should return null when threat results has only request_id', async () => {
      const requestId = 'test-id'
      const threat: AsyncResult<ThreatAnalysisResults> = [
        {
          request_id: requestId,
        },
        undefined,
        false,
      ]

      const { container } = render(<ThreatAnalysis threat={threat} />)

      expect(container.firstChild).toBeNull()
    })
  })
})
