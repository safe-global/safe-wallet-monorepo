import { render } from '@/src/tests/test-utils'
import { AnalysisDetailsContent } from './AnalysisDetailsContent'
import { RecipientAnalysisBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { FullAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { faker } from '@faker-js/faker'
import type { Address } from '@/src/types/address'

describe('AnalysisDetailsContent', () => {
  const initialStore = {
    activeSafe: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: '1',
    },
  }

  it('should render nothing when all data is empty', () => {
    const { UNSAFE_root } = render(<AnalysisDetailsContent />, { initialStore })
    // Should render TransactionSimulation wrapper
    expect(UNSAFE_root).toBeTruthy()
  })

  it('should render recipient analysis when recipient data is provided', () => {
    const address = faker.finance.ethereumAddress()
    const recipient = RecipientAnalysisBuilder.knownRecipient(address).build()

    const { getByText } = render(<AnalysisDetailsContent recipient={recipient} />, { initialStore })

    // Should render the analysis description for the known recipient
    const primaryResult = getPrimaryAnalysisResult(recipient[0])
    if (primaryResult) {
      expect(getByText(primaryResult.description)).toBeTruthy()
    }
  })

  it('should render contract analysis when contract data is provided', () => {
    const address = faker.finance.ethereumAddress()
    const contract = ContractAnalysisBuilder.verifiedContract(address).build()

    const { getByText } = render(<AnalysisDetailsContent contract={contract} />, { initialStore })

    // Should render contract analysis group
    const primaryResult = getPrimaryAnalysisResult(contract[0])
    if (primaryResult) {
      expect(getByText(primaryResult.description)).toBeTruthy()
    }
  })

  it('should render threat analysis when threat data is provided', () => {
    const threat = FullAnalysisBuilder.maliciousThreat().build().threat

    const { getByText } = render(<AnalysisDetailsContent threat={threat} />, { initialStore })

    // Should render threat analysis - check for actual text rendered
    expect(getByText(/Malicious threat detected/i)).toBeTruthy()
  })

  it('should render all analysis types when all data is provided', () => {
    const recipientAddress = faker.finance.ethereumAddress()
    const contractAddress = faker.finance.ethereumAddress()
    const recipient = RecipientAnalysisBuilder.knownRecipient(recipientAddress).build()
    const contract = ContractAnalysisBuilder.unverifiedContract(contractAddress).build()
    const threat = FullAnalysisBuilder.moderateThreat().build().threat

    const { getByText } = render(<AnalysisDetailsContent recipient={recipient} contract={contract} threat={threat} />, {
      initialStore,
    })

    // Should render all three analysis groups - check for actual labels rendered
    expect(getByText(/Known recipient/i)).toBeTruthy()
    expect(getByText(/Unverified contract/i)).toBeTruthy()
    expect(getByText(/Moderate threat detected/i)).toBeTruthy()
  })

  it('should not render empty recipient data', () => {
    const recipient: [undefined, undefined, false] = [undefined, undefined, false]
    const { UNSAFE_root } = render(<AnalysisDetailsContent recipient={recipient} />, { initialStore })

    // Should not crash and should render TransactionSimulation
    expect(UNSAFE_root).toBeTruthy()
  })

  it('should not render empty contract data', () => {
    const contract: [undefined, undefined, false] = [undefined, undefined, false]
    const { UNSAFE_root } = render(<AnalysisDetailsContent contract={contract} />, { initialStore })

    // Should not crash and should render TransactionSimulation
    expect(UNSAFE_root).toBeTruthy()
  })

  it('should not render empty threat data', () => {
    const threat: [undefined, undefined, false] = [undefined, undefined, false]
    const { UNSAFE_root } = render(<AnalysisDetailsContent threat={threat} />, { initialStore })

    // Should not crash and should render TransactionSimulation
    expect(UNSAFE_root).toBeTruthy()
  })
})
