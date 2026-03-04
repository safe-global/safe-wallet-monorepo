import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { DeadlockReason, DeadlockStatus } from '@safe-global/utils/features/safe-shield/types'
import type { DeadlockCheckResult } from '@safe-global/utils/features/safe-shield/types'
import DeadlockAnalysisCard from '../index'

const blockedResult: DeadlockCheckResult = {
  status: DeadlockStatus.BLOCKED,
  reason: DeadlockReason.MUTUAL_DEADLOCK,
  hasDeepNesting: false,
  fetchFailures: [],
}

const warningResult: DeadlockCheckResult = {
  status: DeadlockStatus.WARNING,
  reason: DeadlockReason.DEEP_NESTING,
  hasDeepNesting: true,
  fetchFailures: [],
}

const unknownResult: DeadlockCheckResult = {
  status: DeadlockStatus.UNKNOWN,
  hasDeepNesting: false,
  fetchFailures: ['0x1234567890abcdef1234567890abcdef12345678'],
}

const validResult: DeadlockCheckResult = {
  status: DeadlockStatus.VALID,
  hasDeepNesting: false,
  fetchFailures: [],
}

describe('DeadlockAnalysisCard', () => {
  describe('Null-return cases', () => {
    it('should render nothing when loading', () => {
      const { container } = render(<DeadlockAnalysisCard loading />)
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when result is undefined', () => {
      const { container } = render(<DeadlockAnalysisCard />)
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when status is valid', () => {
      const { container } = render(<DeadlockAnalysisCard result={validResult} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when loading even with a result', () => {
      const { container } = render(<DeadlockAnalysisCard result={blockedResult} loading />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Blocked status', () => {
    it('should render the card with blocked title', () => {
      render(<DeadlockAnalysisCard result={blockedResult} />)

      expect(screen.getByTestId('deadlock-analysis-card')).toBeInTheDocument()
      expect(screen.getByText('Signing deadlock risk detected')).toBeInTheDocument()
    })

    it('should not show the reason by default', () => {
      render(<DeadlockAnalysisCard result={blockedResult} />)

      expect(screen.queryByText(blockedResult.reason!)).not.toBeVisible()
    })

    it('should expand and show the reason when clicked', () => {
      render(<DeadlockAnalysisCard result={blockedResult} />)

      fireEvent.click(screen.getByText('Signing deadlock risk detected'))

      expect(screen.getByText(blockedResult.reason!)).toBeVisible()
    })

    it('should collapse when clicked again', async () => {
      render(<DeadlockAnalysisCard result={blockedResult} />)

      const title = screen.getByText('Signing deadlock risk detected')
      fireEvent.click(title)
      fireEvent.click(title)

      await waitFor(() => {
        expect(screen.queryByText(blockedResult.reason!)).not.toBeVisible()
      })
    })
  })

  describe('Warning status', () => {
    it('should render the card with warning title', () => {
      render(<DeadlockAnalysisCard result={warningResult} />)

      expect(screen.getByTestId('deadlock-analysis-card')).toBeInTheDocument()
      expect(screen.getByText('Nested signer safety could not be fully verified')).toBeInTheDocument()
    })

    it('should show the reason when expanded', () => {
      render(<DeadlockAnalysisCard result={warningResult} />)

      fireEvent.click(screen.getByText('Nested signer safety could not be fully verified'))

      expect(screen.getByText(warningResult.reason!)).toBeVisible()
    })
  })

  describe('Unknown status', () => {
    it('should render with the warning title', () => {
      render(<DeadlockAnalysisCard result={unknownResult} />)

      expect(screen.getByText('Nested signer safety could not be fully verified')).toBeInTheDocument()
    })

    it('should show the fetch-failure reason when expanded', () => {
      render(<DeadlockAnalysisCard result={unknownResult} />)

      fireEvent.click(screen.getByText('Nested signer safety could not be fully verified'))

      expect(screen.getByText(DeadlockReason.FETCH_FAILURE)).toBeVisible()
    })
  })
})
