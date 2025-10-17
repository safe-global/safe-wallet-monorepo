import { render, screen } from '@/tests/test-utils'
import { SafeShieldDisplay } from '../SafeShieldDisplay'
import {
  LiveAnalysisResponseBuilder,
  RecipientAnalysisBuilder,
  ContractAnalysisBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { faker } from '@faker-js/faker'

describe('SafeShieldDisplay', () => {
  const mockRecipientAddress = faker.finance.ethereumAddress()
  const mockContractAddress = faker.finance.ethereumAddress()

  const mockRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
  const mockContract = ContractAnalysisBuilder.verifiedContract(mockContractAddress).build()
  const mockThreat = LiveAnalysisResponseBuilder.noThreat().build().threat
  const mockCriticalRecipient = RecipientAnalysisBuilder.incompatibleSafe(mockRecipientAddress).build()
  const mockWarningRecipient = RecipientAnalysisBuilder.lowActivity(mockRecipientAddress).build()

  beforeEach(() => {
    jest.clearAllMocks()
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

    it('should show "Analyzing details" during loading', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) loadingRecipient[2] = true

      render(<SafeShieldDisplay recipient={loadingRecipient} />)

      expect(screen.getByText('Analyzing details')).toBeInTheDocument()
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

      expect(screen.getByText('Analyzing transaction security...')).toBeInTheDocument()
    })

    it('should show error message in content', () => {
      const error = new Error('Service unavailable')
      const errorContract: [undefined, Error, false] = [undefined, error, false]

      render(<SafeShieldDisplay contract={errorContract} />)

      expect(screen.getByText(/Unable to perform security analysis:/)).toBeInTheDocument()
      expect(screen.getByText(/Service unavailable/)).toBeInTheDocument()
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

      expect(screen.queryByText('Analyzing transaction security...')).not.toBeInTheDocument()
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

      // Threat alone shows empty state because getOverallStatus needs recipient or contract
      expect(
        screen.getByText('Transaction details will be automatically scanned for potential risks and will appear here.'),
      ).toBeInTheDocument()
    })

    it('should handle all props together', () => {
      render(<SafeShieldDisplay recipient={mockRecipient} contract={mockContract} threat={mockThreat} />)

      expect(screen.getByText('Checks passed')).toBeInTheDocument()
      expect(screen.getByText('Secured by')).toBeInTheDocument()
    })
  })

  describe('Malicious Threat Handling', () => {
    it('should handle malicious threat results with critical recipient', () => {
      const maliciousThreat = LiveAnalysisResponseBuilder.maliciousThreat().build().threat

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
