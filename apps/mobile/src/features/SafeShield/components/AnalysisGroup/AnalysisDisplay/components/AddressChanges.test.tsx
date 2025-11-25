import { render } from '@/src/tests/test-utils'
import { AddressChanges } from './AddressChanges'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { faker } from '@faker-js/faker'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

describe('AddressChanges', () => {
  it('should render nothing when result has no before/after addresses', () => {
    const result = ThreatAnalysisResultBuilder.malicious().build()
    const { queryByText } = render(<AddressChanges result={result} />)
    // Component returns null, so no text should be found
    expect(queryByText('CURRENT MASTERCOPY:')).toBeNull()
  })

  it('should render address changes when result has before and after', () => {
    const beforeAddress = faker.finance.ethereumAddress()
    const afterAddress = faker.finance.ethereumAddress()

    const result = ThreatAnalysisResultBuilder.masterCopyChange().changes(beforeAddress, afterAddress).build()

    const { getByText } = render(<AddressChanges result={result} />)

    expect(getByText('CURRENT MASTERCOPY:')).toBeTruthy()
    expect(getByText('NEW MASTERCOPY:')).toBeTruthy()
    expect(getByText(beforeAddress)).toBeTruthy()
    expect(getByText(afterAddress)).toBeTruthy()
  })

  it('should render nothing when only before address is missing', () => {
    const afterAddress = faker.finance.ethereumAddress()
    const result = ThreatAnalysisResultBuilder.masterCopyChange().severity(Severity.CRITICAL).build()

    // Manually set after without before
    const resultWithoutBefore = {
      ...result,
      after: afterAddress,
      before: undefined,
    }

    const { queryByText } = render(<AddressChanges result={resultWithoutBefore as any} />)
    expect(queryByText('CURRENT MASTERCOPY:')).toBeNull()
  })

  it('should render nothing when only after address is missing', () => {
    const beforeAddress = faker.finance.ethereumAddress()
    const result = ThreatAnalysisResultBuilder.masterCopyChange().severity(Severity.CRITICAL).build()

    // Manually set before without after
    const resultWithoutAfter = {
      ...result,
      before: beforeAddress,
      after: undefined,
    }

    const { queryByText } = render(<AddressChanges result={resultWithoutAfter as any} />)
    expect(queryByText('CURRENT MASTERCOPY:')).toBeNull()
  })
})
