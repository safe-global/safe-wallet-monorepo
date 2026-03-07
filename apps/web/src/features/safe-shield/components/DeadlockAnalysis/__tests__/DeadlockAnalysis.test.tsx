import { render, screen } from '@/tests/test-utils'
import { DeadlockAnalysis } from '../index'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { DeadlockAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { DeadlockAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'

// Mock AnalysisGroupCard
jest.mock('../../AnalysisGroupCard', () => ({
  AnalysisGroupCard: jest.fn(({ delay, highlightedSeverity, analyticsEvent, 'data-testid': testId }) => (
    <div data-testid={testId} data-delay={delay} data-severity={highlightedSeverity} data-analytics={analyticsEvent}>
      AnalysisGroupCard
    </div>
  )),
}))

// Mock analytics
jest.mock('@/services/analytics', () => ({
  ...(
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
  SAFE_SHIELD_EVENTS: {
    DEADLOCK_ANALYZED: { action: 'Transaction deadlock analyzed', category: 'safe-shield' },
  },
}))

describe('DeadlockAnalysis', () => {
  it('should render AnalysisGroupCard when deadlock results are present', () => {
    const deadlock = DeadlockAnalysisBuilder.deadlockDetected()

    render(<DeadlockAnalysis deadlock={deadlock} />)

    expect(screen.getByTestId('deadlock-analysis-group-card')).toBeInTheDocument()
    expect(screen.getByText('AnalysisGroupCard')).toBeInTheDocument()
  })

  it('should return null when deadlock results are undefined', () => {
    const deadlock: AsyncResult<DeadlockAnalysisResults> = [undefined, undefined, false]

    const { container } = render(<DeadlockAnalysis deadlock={deadlock} />)

    expect(container.firstChild).toBeNull()
  })

  it('should return null when DEADLOCK array is empty', () => {
    const deadlock: AsyncResult<DeadlockAnalysisResults> = [{ DEADLOCK: [] }, undefined, false]

    const { container } = render(<DeadlockAnalysis deadlock={deadlock} />)

    expect(container.firstChild).toBeNull()
  })

  it('should return null when deadlock results have no DEADLOCK key', () => {
    const deadlock: AsyncResult<DeadlockAnalysisResults> = [{}, undefined, false]

    const { container } = render(<DeadlockAnalysis deadlock={deadlock} />)

    expect(container.firstChild).toBeNull()
  })

  it('should pass delay prop to AnalysisGroupCard', () => {
    const deadlock = DeadlockAnalysisBuilder.deadlockDetected()
    const delay = 500

    render(<DeadlockAnalysis deadlock={deadlock} delay={delay} />)

    const card = screen.getByTestId('deadlock-analysis-group-card')
    expect(card).toHaveAttribute('data-delay', delay.toString())
  })

  it('should pass highlightedSeverity prop to AnalysisGroupCard', () => {
    const deadlock = DeadlockAnalysisBuilder.deadlockDetected()

    render(<DeadlockAnalysis deadlock={deadlock} highlightedSeverity={Severity.CRITICAL} />)

    const card = screen.getByTestId('deadlock-analysis-group-card')
    expect(card).toHaveAttribute('data-severity', Severity.CRITICAL)
  })

  it('should pass analyticsEvent prop to AnalysisGroupCard', () => {
    const deadlock = DeadlockAnalysisBuilder.deadlockDetected()

    render(<DeadlockAnalysis deadlock={deadlock} />)

    const card = screen.getByTestId('deadlock-analysis-group-card')
    expect(card).toHaveAttribute('data-analytics')
  })

  it('should render for nested safe warning', () => {
    const deadlock = DeadlockAnalysisBuilder.nestedSafeWarning()

    render(<DeadlockAnalysis deadlock={deadlock} />)

    expect(screen.getByTestId('deadlock-analysis-group-card')).toBeInTheDocument()
  })
})
