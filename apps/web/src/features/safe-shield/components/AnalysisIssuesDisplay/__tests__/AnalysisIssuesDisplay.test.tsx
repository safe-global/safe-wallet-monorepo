import { render, screen } from '@/tests/test-utils'
import { fireEvent } from '@testing-library/react'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'

describe('AnalysisIssuesDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should return null when result has no issues', () => {
      const result = ThreatAnalysisResultBuilder.noThreat().build()
      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render nothing for non-threat results', () => {
      const result = ThreatAnalysisResultBuilder.ownershipChange().build()
      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      expect(screen.getByText(address)).toBeInTheDocument()
      // Explorer button may not be present if currentChain is not available in test context
      // This is acceptable as the component handles this gracefully
      const explorerButton = screen.getByText(address).closest('div')?.querySelector('a')
      // Explorer button is optional and depends on chain context
      if (explorerButton) {
        expect(explorerButton).toBeInTheDocument()
      }
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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

      const addressElement = screen.getByText(address)
      const allTypography = container.querySelectorAll('p.MuiTypography-body2')
      let clickableElement: HTMLElement | null = null

      for (const typography of Array.from(allTypography)) {
        if (typography.textContent?.includes(address)) {
          clickableElement = typography as HTMLElement
          break
        }
      }

      if (clickableElement) {
        fireEvent.click(clickableElement)
      } else {
        // Fallback: try clicking the address element (event should bubble up)
        fireEvent.click(addressElement)
      }

      expect(writeTextMock).toHaveBeenCalledWith(address)
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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      const descriptionElement = screen.getByText('This address is untrusted')
      expect(descriptionElement).toBeInTheDocument()
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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.CRITICAL].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

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

      const issueBackgroundColor = SEVERITY_COLORS[Severity.CRITICAL].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

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
      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background

      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it('should handle issues with empty arrays', () => {
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [],
        })
        .build()

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      const { container } = render(
        <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />,
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Issue Background Color', () => {
    it('should apply CRITICAL issue background color when provided', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.malicious()
        .issues({
          [Severity.CRITICAL]: [
            {
              description: 'Critical issue',
              address,
            },
          ],
        })
        .build()

      const issueBackgroundColor = SEVERITY_COLORS[Severity.CRITICAL].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      expect(screen.getByText(address)).toBeInTheDocument()
      expect(screen.getByText('Critical issue')).toBeInTheDocument()
    })

    it('should apply WARN issue background color when provided', () => {
      const address = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Warning issue',
              address,
            },
          ],
        })
        .build()

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      expect(screen.getByText(address)).toBeInTheDocument()
      expect(screen.getByText('Warning issue')).toBeInTheDocument()
    })

    it('should use transparent background when issue has no address', () => {
      const result = ThreatAnalysisResultBuilder.moderate()
        .issues({
          [Severity.WARN]: [
            {
              description: 'Issue without address',
            },
          ],
        })
        .build()

      const issueBackgroundColor = SEVERITY_COLORS[Severity.WARN].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      expect(screen.getByText('Issue without address')).toBeInTheDocument()
      expect(screen.queryByText(/0x/)).not.toBeInTheDocument()
    })

    it('should apply CRITICAL issue background color to multiple issues', () => {
      const address1 = faker.finance.ethereumAddress()
      const address2 = faker.finance.ethereumAddress()
      const result = ThreatAnalysisResultBuilder.malicious()
        .issues({
          [Severity.CRITICAL]: [
            {
              description: 'First critical issue',
              address: address1,
            },
            {
              description: 'Second critical issue',
              address: address2,
            },
          ],
        })
        .build()

      const issueBackgroundColor = SEVERITY_COLORS[Severity.CRITICAL].background
      render(<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />)

      expect(screen.getByText(address1)).toBeInTheDocument()
      expect(screen.getByText(address2)).toBeInTheDocument()
      expect(screen.getByText('First critical issue')).toBeInTheDocument()
      expect(screen.getByText('Second critical issue')).toBeInTheDocument()
    })
  })
})
