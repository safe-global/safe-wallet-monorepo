import { render } from '@/src/tests/test-utils'
import { AnalysisDetails } from './AnalysisDetails'
import { RecipientAnalysisBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'
import type { Address } from '@/src/types/address'

describe('AnalysisDetails', () => {
  const initialStore = {
    activeSafe: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: '1',
    },
  }

  it('should render with default OK severity when no data is provided', () => {
    const { getByText } = render(<AnalysisDetails />, { initialStore })
    expect(getByText('Checks passed')).toBeTruthy()
  })

  it('should render recipient analysis', () => {
    const address = faker.finance.ethereumAddress()
    const recipient = RecipientAnalysisBuilder.knownRecipient(address).build()

    const { getByText } = render(<AnalysisDetails recipient={recipient} />, { initialStore })

    expect(getByText('Checks passed')).toBeTruthy()
  })

  it('should render contract analysis', () => {
    const address = faker.finance.ethereumAddress()
    const contract = ContractAnalysisBuilder.unverifiedContract(address).build()

    const { getByText } = render(<AnalysisDetails contract={contract} />, { initialStore })

    expect(getByText(/Review details|Issues found/i)).toBeTruthy()
  })

  it('should render threat analysis', () => {
    const threat = FullAnalysisBuilder.maliciousThreat().build().threat

    const { getByText } = render(<AnalysisDetails threat={threat} />, { initialStore })

    expect(getByText('Risk detected')).toBeTruthy()
  })

  it('should render all analysis types together', () => {
    const recipientAddress = faker.finance.ethereumAddress()
    const contractAddress = faker.finance.ethereumAddress()
    const recipient = RecipientAnalysisBuilder.lowActivity(recipientAddress).build()
    const contract = ContractAnalysisBuilder.unverifiedContract(contractAddress).build()
    const threat = FullAnalysisBuilder.maliciousThreat().build().threat

    const { getByText } = render(<AnalysisDetails recipient={recipient} contract={contract} threat={threat} />, {
      initialStore,
    })

    // Should show the highest severity (CRITICAL from threat)
    expect(getByText('Risk detected')).toBeTruthy()
  })

  it('should determine overall status from all analysis types', () => {
    const recipientAddress = faker.finance.ethereumAddress()
    const contractAddress = faker.finance.ethereumAddress()
    const recipient = RecipientAnalysisBuilder.knownRecipient(recipientAddress).build()
    const contract = ContractAnalysisBuilder.verifiedContract(contractAddress).build()
    const threat = FullAnalysisBuilder.noThreat().build().threat

    const { getByText } = render(<AnalysisDetails recipient={recipient} contract={contract} threat={threat} />, {
      initialStore,
    })

    // Should show OK when all are safe
    expect(getByText('Checks passed')).toBeTruthy()
  })

  it('should handle loading state', () => {
    const recipient: [undefined, undefined, boolean] = [undefined, undefined, true]
    const { getByText } = render(<AnalysisDetails recipient={recipient} />, { initialStore })

    // Should still render with default OK severity
    expect(getByText('Checks passed')).toBeTruthy()
  })

  it('should handle error state', () => {
    const error = new Error('Test error')
    const recipient: [undefined, Error, boolean] = [undefined, error, false]
    const { getByText } = render(<AnalysisDetails recipient={recipient} />, { initialStore })

    // Should still render with default OK severity
    expect(getByText('Checks passed')).toBeTruthy()
  })
})
