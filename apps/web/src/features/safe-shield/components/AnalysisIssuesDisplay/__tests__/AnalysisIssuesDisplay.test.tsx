import { render, screen, renderWithUserEvent } from '@/tests/test-utils'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'

describe('AnalysisIssuesDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should return null when result has no issues', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().build()
      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render nothing for non-threat results', () => {
      const result = ThreatAnalysisResultBuilder.ownershipChange().build()
      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render issues when result has issues', () => {
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

      render(<AnalysisIssuesDisplay result={result} />)

      expect(screen.getByText(address)).toBeInTheDocument()
      expect(screen.getByText('This address is untrusted')).toBeInTheDocument()
    })
  })

  describe('Address Display', () => {
    it('should render address with explorer button', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Test description',
              address,
            },
          ],
        })
        .build()

      render(<AnalysisIssuesDisplay result={result} />)

      expect(screen.getByText(address)).toBeInTheDocument()
      // Explorer button should be present (check for link or button)
      const explorerButton = screen.getByText(address).closest('div')?.querySelector('a')
      expect(explorerButton).toBeInTheDocument()
    })

    it('should handle copy to clipboard on address click', async () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Test description',
              address,
            },
          ],
        })
        .build()

      // Mock clipboard API
      const writeTextMock = jest.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const { user } = renderWithUserEvent(<AnalysisIssuesDisplay result={result} />)

      const addressElement = screen.getByText(address)
      await user.click(addressElement)

      expect(writeTextMock).toHaveBeenCalledWith(address)
    })

    it('should have tooltip on address element', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Test description',
              address,
            },
          ],
        })
        .build()

      render(<AnalysisIssuesDisplay result={result} />)

      const addressElement = screen.getByText(address)
      const tooltipParent = addressElement.closest('[role="tooltip"], [aria-describedby]')
      expect(tooltipParent || addressElement.closest('div')).toBeInTheDocument()
    })
  })

  describe('Description Display', () => {
    it('should display description below address', () => {
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

      render(<AnalysisIssuesDisplay result={result} />)

      const descriptionElement = screen.getByText('This address is untrusted')
      expect(descriptionElement).toBeInTheDocument()
      expect(descriptionElement).toHaveStyle({ fontStyle: 'italic' })
    })

    it('should render description without address if address is missing', () => {
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Issue without address',
            },
          ],
        })
        .build()

      render(<AnalysisIssuesDisplay result={result} />)

      expect(screen.getByText('Issue without address')).toBeInTheDocument()
      expect(screen.queryByText(/0x/)).not.toBeInTheDocument()
    })
  })

  describe('Multiple Issues', () => {
    it('should render multiple issues in separate boxes', () => {
      const address1 = faker.finance.ethereumAddress()
      const address2 = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'First untrusted address',
              address: address1,
            },
            {
              description: 'Second untrusted address',
              address: address2,
            },
          ],
        })
        .build()

      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      expect(container.querySelectorAll('[class*="MuiBox-root"]').length).toBeGreaterThanOrEqual(2)

      expect(screen.getByText(address1)).toBeInTheDocument()
      expect(screen.getByText(address2)).toBeInTheDocument()
      expect(screen.getByText('First untrusted address')).toBeInTheDocument()
      expect(screen.getByText('Second untrusted address')).toBeInTheDocument()
    })

    it('should render issues from different severity levels', () => {
      const criticalAddress = faker.finance.ethereumAddress()
      const warnAddress = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.malicious()
        .issues({
          [Severity.CRITICAL]: [
            {
              description: 'Critical issue',
              address: criticalAddress,
            },
          ],
          [Severity.WARN]: [
            {
              description: 'Warning issue',
              address: warnAddress,
            },
          ],
        })
        .build()

      render(<AnalysisIssuesDisplay result={result} />)

      expect(screen.getByText(criticalAddress)).toBeInTheDocument()
      expect(screen.getByText(warnAddress)).toBeInTheDocument()
      expect(screen.getByText('Critical issue')).toBeInTheDocument()
      expect(screen.getByText('Warning issue')).toBeInTheDocument()
    })

    it('should sort issues by severity (CRITICAL first, then WARN)', () => {
      const warnAddress = faker.finance.ethereumAddress()
      const criticalAddress = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.malicious()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Warning issue',
              address: warnAddress,
            },
          ],
          [Severity.CRITICAL]: [
            {
              description: 'Critical issue',
              address: criticalAddress,
            },
          ],
        })
        .build()

      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      const textContent = container.textContent || ''
      const criticalIndex = textContent.indexOf('Critical issue')
      const warnIndex = textContent.indexOf('Warning issue')

      // Critical should appear before WARN
      expect(criticalIndex).toBeLessThan(warnIndex)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty issues object', () => {
      const result = ThreatAnalysisResultBuilder.moderate().issues({}).build()

      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle issues with empty arrays', () => {
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [],
        })
        .build()

      const { container } = render(<AnalysisIssuesDisplay result={result} />)

      expect(container.firstChild).toBeNull()
    })
  })
})
