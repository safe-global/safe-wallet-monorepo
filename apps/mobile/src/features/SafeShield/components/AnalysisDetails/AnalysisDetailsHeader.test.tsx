import { render } from '@/src/tests/test-utils'
import { AnalysisDetailsHeader } from './AnalysisDetailsHeader'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

describe('AnalysisDetailsHeader', () => {
  it('should render SafeShieldHeadline with OK severity', () => {
    const { getByText } = render(<AnalysisDetailsHeader severity={Severity.OK} />)
    expect(getByText('Checks passed')).toBeTruthy()
  })

  it('should render SafeShieldHeadline with CRITICAL severity', () => {
    const { getByText } = render(<AnalysisDetailsHeader severity={Severity.CRITICAL} />)
    expect(getByText('Risk detected')).toBeTruthy()
  })

  it('should render SafeShieldHeadline with INFO severity', () => {
    const { getByText } = render(<AnalysisDetailsHeader severity={Severity.INFO} />)
    expect(getByText('Review details')).toBeTruthy()
  })

  it('should render SafeShieldHeadline with WARN severity', () => {
    const { getByText } = render(<AnalysisDetailsHeader severity={Severity.WARN} />)
    expect(getByText('Issues found')).toBeTruthy()
  })
})

