import { render, screen } from '@/tests/test-utils'
import { AnalysisGroupCardItem } from '../AnalysisGroupCardItem'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'

jest.mock('../../ShowAllAddress/ShowAllAddress', () => ({
  ShowAllAddress: ({ addresses }: { addresses: Array<{ address: string }> }) => (
    <div data-testid="show-all-address">
      {addresses.map((addr) => (
        <div key={addr.address}>{addr.address}</div>
      ))}
    </div>
  ),
}))

// Mock AnalysisIssuesDisplay to verify it's rendered
jest.mock('../../AnalysisIssuesDisplay', () => ({
  AnalysisIssuesDisplay: ({ result }: { result: any }) => {
    if ('issues' in result) {
      return <div data-testid="analysis-issues-display">Issues Display</div>
    }
    return null
  },
}))

describe('AnalysisGroupCardItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the component with description', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().description('Test description').build()

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('should use custom description when provided', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().description('Default description').build()

      render(<AnalysisGroupCardItem result={result} description="Custom description" />)

      expect(screen.getByText('Custom description')).toBeInTheDocument()
      expect(screen.queryByText('Default description')).not.toBeInTheDocument()
    })

    it('should apply severity border color when severity is provided', () => {
      const result = ThreatAnalysisResultBuilder.moderate().build()

      const { container } = render(<AnalysisGroupCardItem result={result} severity={Severity.WARN} />)

      const borderBox = container.querySelector('[style*="border-left"]')
      expect(borderBox).toBeInTheDocument()
    })
  })

  describe('ShowAllAddress Conditional Rendering', () => {
    it('should NOT render ShowAllAddress when result has issues', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'This address is untrusted',
              address,
            },
          ],
        })
        .build()
      // Add addresses to result (simulating what transformThreatAnalysisResponse does)
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      // ShowAllAddress should NOT be rendered
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })

    it('should render the ShowAllAddress dropdown when result has NO issues', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.noThreat().build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      // ShowAllAddress should be rendered
      expect(screen.getByTestId('show-all-address')).toBeInTheDocument()
      expect(screen.getByText(address)).toBeInTheDocument()
    })

    it('should render ShowAllAddress for ownership change results (no issues)', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.ownershipChange().build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('show-all-address')).toBeInTheDocument()
    })

    it('should render ShowAllAddress for module change results (no issues)', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moduleChange().build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('show-all-address')).toBeInTheDocument()
    })

    it('should render ShowAllAddress for mastercopy change results (no issues)', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.masterCopyChange().build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('show-all-address')).toBeInTheDocument()
    })

    it('should NOT render ShowAllAddress when addresses array is empty', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().build()
      result.addresses = []

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })

    it('should NOT render ShowAllAddress when addresses is undefined', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().build()

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })
  })

  describe('AnalysisIssuesDisplay Rendering', () => {
    it('should render AnalysisIssuesDisplay when result has issues', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'This address is untrusted',
              address,
            },
          ],
        })
        .build()

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('analysis-issues-display')).toBeInTheDocument()
    })

    it('should NOT render AnalysisIssuesDisplay when result has no issues', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().build()

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('analysis-issues-display')).not.toBeInTheDocument()
    })

    it('should render both AnalysisIssuesDisplay and hide ShowAllAddress for malicious threats', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.malicious()
        .issues({
          [Severity.CRITICAL]: [
            {
              description: 'Malicious address detected',
              address,
            },
          ],
        })
        .build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      // Should show issues display
      expect(screen.getByTestId('analysis-issues-display')).toBeInTheDocument()
      // Should NOT show ShowAllAddress dropdown
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })
  })

  describe('Multiple Result Types', () => {
    it('should handle moderate threat with issues correctly', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Moderate threat issue',
              address,
            },
          ],
        })
        .build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('analysis-issues-display')).toBeInTheDocument()
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })

    it('should handle no threat result correctly', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.noThreat().build()
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('analysis-issues-display')).not.toBeInTheDocument()
      expect(screen.getByTestId('show-all-address')).toBeInTheDocument()
    })

    it('should handle failed threat analysis correctly', () => {
      const result = ThreatAnalysisResultBuilder.failed().build()

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('analysis-issues-display')).not.toBeInTheDocument()
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle result with issues but no addresses in issues', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Issue without address',
            },
          ],
        })
        .build()
      // Add addresses to result (simulating what transformThreatAnalysisResponse does)
      result.addresses = [{ address }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.getByTestId('analysis-issues-display')).toBeInTheDocument()
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })

    it('should handle result with empty issues object', () => {
      const result = ThreatAnalysisResultBuilder.moderate().issues({}).build()
      result.addresses = [{ address: faker.finance.ethereumAddress() }]

      render(<AnalysisGroupCardItem result={result} />)

      expect(screen.queryByTestId('analysis-issues-display')).not.toBeInTheDocument()
      expect(screen.queryByTestId('show-all-address')).not.toBeInTheDocument()
    })
  })
})
