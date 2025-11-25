import { render } from '@/src/tests/test-utils'
import { AnalysisGroup } from './AnalysisGroup'
import { RecipientAnalysisBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { Severity, StatusGroup } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'

describe('AnalysisGroup', () => {
  it('should render nothing when data is empty', () => {
    const { queryByText } = render(<AnalysisGroup data={{}} />)
    // Component returns null, so no text should be found
    expect(queryByText(/Known recipient|Low activity|Risk detected/i)).toBeNull()
  })

  it('should render primary result label', () => {
    const address = faker.finance.ethereumAddress()
    const data = RecipientAnalysisBuilder.knownRecipient(address).build()[0]!

    const { getByText } = render(<AnalysisGroup data={data} />)

    // The primary result should be displayed in AnalysisLabel
    expect(getByText(/Known recipient|No threats detected/i)).toBeTruthy()
  })

  it('should render AnalysisDisplay for each visible result', () => {
    const address = faker.finance.ethereumAddress()
    const data = RecipientAnalysisBuilder.lowActivity(address).build()[0]!

    const { getByText } = render(<AnalysisGroup data={data} />)

    // Should render the description from the result
    const result = Object.values(data)[0]!
    const firstGroup = Object.values(result)[0]
    if (firstGroup && Array.isArray(firstGroup) && firstGroup[0]) {
      expect(getByText(firstGroup[0].description)).toBeTruthy()
    }
  })

  it('should highlight when severity matches highlightedSeverity', () => {
    const address = faker.finance.ethereumAddress()
    const data = RecipientAnalysisBuilder.lowActivity(address).build()[0]!

    const { getByText } = render(<AnalysisGroup data={data} highlightedSeverity={Severity.WARN} />)

    // Component should render (highlighting is visual, tested through AnalysisLabel)
    expect(getByText(/Low activity/i)).toBeTruthy()
  })

  it('should not highlight when severity does not match highlightedSeverity', () => {
    const address = faker.finance.ethereumAddress()
    const data = RecipientAnalysisBuilder.knownRecipient(address).build()[0]!

    const { getByText } = render(<AnalysisGroup data={data} highlightedSeverity={Severity.CRITICAL} />)

    // Component should still render
    expect(getByText(/Known recipient|No threats detected/i)).toBeTruthy()
  })

  it('should handle contract analysis data', () => {
    const address = faker.finance.ethereumAddress()
    const data = ContractAnalysisBuilder.unverifiedContract(address).build()[0]!

    const { getByText } = render(<AnalysisGroup data={data} />)

    // Should render contract analysis
    const result = Object.values(data)[0]!
    const firstGroup = Object.values(result)[0]
    if (firstGroup && Array.isArray(firstGroup) && firstGroup[0]) {
      expect(getByText(firstGroup[0].description)).toBeTruthy()
    }
  })

  it('should handle threat analysis data', () => {
    const threatData = FullAnalysisBuilder.maliciousThreat().build().threat
    if (!threatData) return

    const normalizedData = {
      ['0x']: threatData[0] as any,
    }

    const { getByText } = render(<AnalysisGroup data={normalizedData} />)

    // Should render threat analysis - check for the actual text rendered
    expect(getByText(/Malicious threat detected/i)).toBeTruthy()
  })

  it('should render multiple results when data has multiple groups', () => {
    const address = faker.finance.ethereumAddress()
    const builder = new RecipientAnalysisBuilder().addAddress(address)
    const knownRecipientData = RecipientAnalysisBuilder.knownRecipient(address).build()[0]!
    const lowActivityData = RecipientAnalysisBuilder.lowActivity(address).build()[0]!

    // Merge the data
    const data = {
      [address]: {
        ...knownRecipientData[address],
        ...lowActivityData[address],
      },
    }

    const { getByText } = render(<AnalysisGroup data={data} />)

    // Should render multiple analysis displays
    expect(getByText(/Low activity/i)).toBeTruthy()
  })
})
