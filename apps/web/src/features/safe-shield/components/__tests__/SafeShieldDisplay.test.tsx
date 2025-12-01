import { render, screen } from '@/tests/test-utils'
import { SafeShieldDisplay } from '../SafeShieldDisplay'
import {
  FullAnalysisBuilder,
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

describe('SafeShieldDisplay', () => {
  let mockRecipientAddress: string
  let mockContractAddress: string
  let mockRecipient: any
  let mockContract: any
  let mockThreat: any
  let mockCriticalRecipient: any
  let mockWarningRecipient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Recreate mocks for each test to avoid mutation issues
    mockRecipientAddress = faker.finance.ethereumAddress()
    mockContractAddress = faker.finance.ethereumAddress()
    mockRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
    mockContract = ContractAnalysisBuilder.verifiedContract(mockContractAddress).build()
    mockThreat = FullAnalysisBuilder.noThreat().build().threat
    mockCriticalRecipient = RecipientAnalysisBuilder.incompatibleSafe(mockRecipientAddress).build()
    mockWarningRecipient = RecipientAnalysisBuilder.lowActivity(mockRecipientAddress).build()
  })

  describe('Basic Rendering', () => {
    it('should render the component with all main elements', () => {
      render(<SafeShieldDisplay />)

      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })

    it('should render without any props', () => {
      const { container } = render(<SafeShieldDisplay />)

      expect(container.querySelector('.MuiCard-root')).toBeInTheDocument()
      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })

    it('should have correct layout structure', () => {
      const { container } = render(<SafeShieldDisplay />)

      // Check for Stack container
      const stacks = container.querySelectorAll('.MuiStack-root')
      expect(stacks.length).toBeGreaterThan(0)

      // Check for Card container
      const card = container.querySelector('.MuiCard-root')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Header States', () => {
    it('should show "Checks passed" when all results are OK', () => {
      render(<SafeShieldDisplay recipient={mockRecipient} contract={mockContract} />)

      expect(screen.getByText('Checks passed')).toBeInTheDocument()
    })

    it('should show "Risk detected" when there are critical issues', () => {
      render(<SafeShieldDisplay recipient={mockCriticalRecipient} />)

      expect(screen.getByText('Risk detected')).toBeInTheDocument()
    })

    it('should show "Issues found" when there are warnings', () => {
      render(<SafeShieldDisplay recipient={mockWarningRecipient} />)

      expect(screen.getByText('Issues found')).toBeInTheDocument()
    })

    it('should show "Analyzing..." during loading', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) loadingRecipient[2] = true

      render(<SafeShieldDisplay recipient={loadingRecipient} />)

      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    })

    it('should show "Checks unavailable" on error', () => {
      const error = new Error('Analysis failed')
      const errorRecipient: [undefined, Error, false] = [undefined, error, false]

      render(<SafeShieldDisplay recipient={errorRecipient} />)

      expect(screen.getByText('Checks unavailable')).toBeInTheDocument()
    })
  })

  describe('Content States', () => {
    it('should show loading state in content', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) loadingRecipient[2] = true

      render(<SafeShieldDisplay recipient={loadingRecipient} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error message in content', () => {
      const errorContract = FullAnalysisBuilder.failedContract().build().contract

      render(<SafeShieldDisplay contract={errorContract} />)

      expect(screen.getByText('Contract analysis failed')).toBeInTheDocument()
      expect(screen.getByText('Contract analysis failed. Review before processing.')).toBeInTheDocument()
    })

    it('should show empty state when no results', () => {
      const emptyRecipient: [{}, undefined, false] = [{}, undefined, false]
      const emptyContract: [{}, undefined, false] = [{}, undefined, false]

      render(<SafeShieldDisplay recipient={emptyRecipient} contract={emptyContract} />)

      expect(
        screen.getByText('Transaction details will be automatically scanned for potential risks and will appear here.'),
      ).toBeInTheDocument()
    })

    it('should not show loading state when data is present', () => {
      render(<SafeShieldDisplay recipient={mockRecipient} />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Props Integration', () => {
    it('should handle recipient results', () => {
      render(<SafeShieldDisplay recipient={mockRecipient} />)

      // Header should show status
      expect(screen.getByText('Checks passed')).toBeInTheDocument()
      // Content should not show empty state
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle contract results', () => {
      render(<SafeShieldDisplay contract={mockContract} />)

      // Header should show status
      expect(screen.getByText('Checks passed')).toBeInTheDocument()
      // Content should not show empty state
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle threat results', () => {
      render(<SafeShieldDisplay threat={mockThreat} />)

      // Threat data is displayed with appropriate status
      expect(screen.getByText('Checks passed')).toBeInTheDocument()
      // Content should not show empty state when threat data is present
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle all props together', () => {
      render(<SafeShieldDisplay recipient={mockRecipient} contract={mockContract} threat={mockThreat} />)

      expect(screen.getByText('Checks passed')).toBeInTheDocument()
      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })
  })

  describe('Malicious Threat Handling', () => {
    it('should handle malicious threat results with critical recipient', () => {
      const maliciousThreat = FullAnalysisBuilder.maliciousThreat().build().threat

      render(<SafeShieldDisplay threat={maliciousThreat} recipient={mockCriticalRecipient} />)

      // Header shows "Risk detected" from critical recipient, threat content is displayed
      expect(screen.getByText('Risk detected')).toBeInTheDocument()
      expect(screen.getByText('Malicious threat detected')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should always render the "Secured by" footer', () => {
      render(<SafeShieldDisplay />)

      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })

    it('should render footer even with errors', () => {
      const error = new Error('Analysis failed')
      const errorRecipient: [undefined, Error, false] = [undefined, error, false]

      render(<SafeShieldDisplay recipient={errorRecipient} />)

      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })

    it('should render footer during loading', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) {
        loadingRecipient[2] = true
      }

      render(<SafeShieldDisplay recipient={loadingRecipient} />)

      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })
  })
})
