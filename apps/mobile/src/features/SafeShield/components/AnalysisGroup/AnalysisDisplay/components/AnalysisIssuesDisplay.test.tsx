import { render } from '@/src/tests/test-utils'
import { AnalysisIssuesDisplay } from './AnalysisIssuesDisplay'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { RecipientAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders'
import type { Address } from '@/src/types/address'

describe('AnalysisIssuesDisplay', () => {
  const initialStore = {
    activeSafe: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: '1',
    },
  }

  it('should render nothing when result has no issues', () => {
    const result = RecipientAnalysisResultBuilder.knownRecipient().build()
    const { queryByText } = render(<AnalysisIssuesDisplay result={result} />, { initialStore })
    // Component returns null, so no text should be found
    expect(queryByText(/issue/i)).toBeNull()
  })

  it('should render issues when result has issues', () => {
    const result = ThreatAnalysisResultBuilder.malicious()
      .issues({
        [Severity.CRITICAL]: [{ description: 'Critical issue 1' }, { description: 'Critical issue 2' }],
        [Severity.WARN]: [{ description: 'Warning issue 1' }],
      })
      .build()

    const { getByText } = render(<AnalysisIssuesDisplay result={result} />, { initialStore })

    expect(getByText('Critical issue 1')).toBeTruthy()
    expect(getByText('Critical issue 2')).toBeTruthy()
    expect(getByText('Warning issue 1')).toBeTruthy()
  })

  it('should sort issues by severity', () => {
    const result = ThreatAnalysisResultBuilder.moderate()
      .issues({
        [Severity.WARN]: [{ description: 'Warning issue' }],
        [Severity.CRITICAL]: [{ description: 'Critical issue' }],
        [Severity.INFO]: [{ description: 'Info issue' }],
      })
      .build()

    const { getAllByText } = render(<AnalysisIssuesDisplay result={result} />, { initialStore })

    const issues = getAllByText(/issue/)
    expect(issues).toHaveLength(3)
    // Critical should come first
    expect(issues[0].props.children).toBe('Critical issue')
  })
})
