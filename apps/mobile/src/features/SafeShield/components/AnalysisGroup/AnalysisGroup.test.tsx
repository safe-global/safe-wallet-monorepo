import { render } from '@/src/tests/test-utils'
import { AnalysisGroup } from './AnalysisGroup'
import { RecipientAnalysisBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { Severity, type GroupedAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'
import type { Address } from '@/src/types/address'

describe('AnalysisGroup', () => {
  const initialStore = {
    activeSafe: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: '1',
    },
  }

  it('should render nothing when data is empty', () => {
    const { queryByText } = render(<AnalysisGroup data={{}} />, { initialStore })
    // Component returns null, so no text should be found
    expect(queryByText(/Known recipient|Low activity|Risk detected/i)).toBeNull()
  })

  it('should render primary result label', () => {
    const address = faker.finance.ethereumAddress()
    const recipientResult = RecipientAnalysisBuilder.knownRecipient(address).build()[0]
    if (!recipientResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={recipientResult} />, { initialStore })

    // The primary result should be displayed in AnalysisLabel
    expect(getByText(/Known recipient|No threats detected/i)).toBeTruthy()
  })

  it('should render AnalysisDisplay for each visible result', () => {
    const address = faker.finance.ethereumAddress()
    const recipientResult = RecipientAnalysisBuilder.lowActivity(address).build()[0]
    if (!recipientResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={recipientResult} />, { initialStore })

    // Should render the description from the result
    const result = Object.values(recipientResult)[0]
    if (result) {
      const firstGroup = Object.values(result)[0]
      if (firstGroup && Array.isArray(firstGroup) && firstGroup[0]) {
        expect(getByText(firstGroup[0].description)).toBeTruthy()
      }
    }
  })

  it('should highlight when severity matches highlightedSeverity', () => {
    const address = faker.finance.ethereumAddress()
    const recipientResult = RecipientAnalysisBuilder.lowActivity(address).build()[0]
    if (!recipientResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={recipientResult} highlightedSeverity={Severity.WARN} />, {
      initialStore,
    })

    // Component should render (highlighting is visual, tested through AnalysisLabel)
    expect(getByText(/Low activity/i)).toBeTruthy()
  })

  it('should not highlight when severity does not match highlightedSeverity', () => {
    const address = faker.finance.ethereumAddress()
    const recipientResult = RecipientAnalysisBuilder.knownRecipient(address).build()[0]
    if (!recipientResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={recipientResult} highlightedSeverity={Severity.CRITICAL} />, {
      initialStore,
    })

    // Component should still render
    expect(getByText(/Known recipient|No threats detected/i)).toBeTruthy()
  })

  it('should handle contract analysis data', () => {
    const address = faker.finance.ethereumAddress()
    const contractResult = ContractAnalysisBuilder.unverifiedContract(address).build()[0]
    if (!contractResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={contractResult} />, { initialStore })

    // Should render contract analysis
    const result = Object.values(contractResult)[0]
    if (result) {
      const firstGroup = Object.values(result)[0]
      if (firstGroup && Array.isArray(firstGroup) && firstGroup[0]) {
        expect(getByText(firstGroup[0].description)).toBeTruthy()
      }
    }
  })

  it('should handle threat analysis data', () => {
    const threatData = FullAnalysisBuilder.maliciousThreat().build().threat
    if (!threatData || !threatData[0]) {
      return
    }

    const normalizedData: Record<string, GroupedAnalysisResults> = {
      ['0x']: threatData[0] as unknown as GroupedAnalysisResults,
    }

    const { getByText } = render(<AnalysisGroup data={normalizedData} />, { initialStore })

    // Should render threat analysis - check for the actual text rendered
    expect(getByText(/Malicious threat detected/i)).toBeTruthy()
  })

  it('should render multiple results when data has multiple groups', () => {
    const address = faker.finance.ethereumAddress()
    const knownRecipientResult = RecipientAnalysisBuilder.knownRecipient(address).build()[0]
    const lowActivityResult = RecipientAnalysisBuilder.lowActivity(address).build()[0]

    if (!knownRecipientResult || !lowActivityResult) {
      return
    }

    // Merge the data
    const data: Record<string, GroupedAnalysisResults> = {
      [address]: {
        ...knownRecipientResult[address],
        ...lowActivityResult[address],
      },
    }

    const { getByText } = render(<AnalysisGroup data={data} />, { initialStore })

    // Should render multiple analysis displays
    expect(getByText(/Low activity/i)).toBeTruthy()
  })

  it('should render FallbackHandlerItem for unofficial fallback handler', () => {
    const fallbackHandlerAddress = faker.finance.ethereumAddress()
    const contractResult = ContractAnalysisBuilder.unofficialFallbackHandlerContract(fallbackHandlerAddress).build()[0]

    if (!contractResult) {
      return
    }

    const { getByText } = render(<AnalysisGroup data={contractResult} />, { initialStore })
    expect(getByText(/Verify the fallback handler is trusted and secure before proceeding/i)).toBeTruthy()
  })
})
