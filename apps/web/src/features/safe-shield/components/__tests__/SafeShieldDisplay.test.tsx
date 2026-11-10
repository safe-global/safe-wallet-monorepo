import { useCallback, useMemo, useState } from 'react'
import { http, HttpResponse } from 'msw'
import { JsonRpcProvider, Network, toQuantity } from 'ethers'
import { fakerChecksummedAddress, render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { SafeShieldDisplay } from '../SafeShieldDisplay'
import { RecipientAnalysisBuilder, ContractAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis.builder'
import { faker } from '@faker-js/faker'
import * as useCheckSimulation from '../../hooks/useCheckSimulation'
import type {
  RecipientAnalysisResults,
  ContractAnalysisResults,
  ThreatAnalysisResults,
  DeadlockAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useRecipientAnalysis } from '@safe-global/utils/features/safe-shield/hooks'
import { transformThreatAnalysisResponse } from '@safe-global/utils/features/safe-shield/utils/transformThreatAnalysisResponse'
import type {
  SingleRecipientAnalysisDto,
  ThreatAnalysisResponseDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'
import { useSafenetShieldState, type SafenetShieldState } from '@/features/safenet-checks'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

// Mock hooks
jest.mock('../../hooks/useCheckSimulation')
jest.mock('@/features/safenet-checks', () => ({
  ...jest.requireActual('@/features/safenet-checks'),
  useSafenetShieldState: jest.fn(),
}))

const mockSafenetState = (state: Partial<SafenetShieldState> = {}) =>
  jest
    .mocked(useSafenetShieldState)
    .mockReturnValue({ check: { shown: false, passed: false }, risk: undefined, ...state })

// Default empty AsyncResult values
const emptyRecipient: AsyncResult<RecipientAnalysisResults> = [{}, undefined, false]
const emptyContract: AsyncResult<ContractAnalysisResults> = [{}, undefined, false]
const emptyThreat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]
const emptyDeadlock: AsyncResult<DeadlockAnalysisResults> = [{}, undefined, false]

const CHAIN_ID = '137'
const RPC_URL = 'https://rpc.safe-shield.test'
const NO_ADDRESSES: string[] = []

type RpcRequest = { id: number }

const mockRecipientServices = ({ isSafe, txCount }: { isSafe: boolean; txCount: number }) => {
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/security/:safeAddress/recipient/:recipientAddress`, () =>
      HttpResponse.json<SingleRecipientAnalysisDto>({ isSafe, RECIPIENT_INTERACTION: [] }),
    ),
    http.post(RPC_URL, async ({ request }) => {
      const body = (await request.json()) as RpcRequest | RpcRequest[]
      const reply = ({ id }: RpcRequest) => ({ jsonrpc: '2.0', id, result: toQuantity(txCount) })
      return HttpResponse.json(Array.isArray(body) ? body.map(reply) : reply(body))
    }),
  )
}

const RecipientShield = ({
  safeAddress,
  recipient,
  addressBook = NO_ADDRESSES,
  ownedSafes = NO_ADDRESSES,
}: {
  safeAddress: string
  recipient: string
  addressBook?: string[]
  ownedSafes?: string[]
}) => {
  const [web3ReadOnly] = useState(
    () => new JsonRpcProvider(RPC_URL, Network.from(Number(CHAIN_ID)), { staticNetwork: true }),
  )
  const recipients = useMemo(() => [recipient], [recipient])
  const isInAddressBook = useCallback(
    (address: string) => addressBook.some((entry) => sameAddress(entry, address)),
    [addressBook],
  )
  const analysis = useRecipientAnalysis({
    safeAddress,
    chainId: CHAIN_ID,
    recipients,
    isInAddressBook,
    ownedSafes,
    web3ReadOnly,
    debounceDelay: 0,
  })

  return (
    <SafeShieldDisplay
      recipient={analysis ?? emptyRecipient}
      contract={emptyContract}
      threat={emptyThreat}
      deadlock={emptyDeadlock}
    />
  )
}

describe('SafeShieldDisplay', () => {
  let mockRecipientAddress: string
  let mockContractAddress: string
  let mockRecipient: AsyncResult<RecipientAnalysisResults>
  let mockContract: AsyncResult<ContractAnalysisResults>
  let mockThreat: AsyncResult<ThreatAnalysisResults>
  let mockCriticalRecipient: AsyncResult<RecipientAnalysisResults>
  let mockWarningRecipient: AsyncResult<RecipientAnalysisResults>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSafenetState()

    // Mock useCheckSimulation to return no simulation error by default
    jest.spyOn(useCheckSimulation, 'useCheckSimulation').mockReturnValue({
      hasSimulationError: false,
      isSimulationSuccess: false,
    })

    // Recreate mocks for each test to avoid mutation issues
    mockRecipientAddress = faker.finance.ethereumAddress()
    mockContractAddress = faker.finance.ethereumAddress()
    mockRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
    mockContract = ContractAnalysisBuilder.verifiedContract(mockContractAddress).build()
    mockThreat = ThreatAnalysisBuilder.noThreat()
    mockCriticalRecipient = RecipientAnalysisBuilder.incompatibleSafe(mockRecipientAddress).build()
    mockWarningRecipient = RecipientAnalysisBuilder.lowActivity(mockRecipientAddress).build()
  })

  describe('Basic Rendering', () => {
    it('should render the component with all main elements', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })

    it('should render with empty props', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-widget')).toBeInTheDocument()
      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })

    it('should have correct layout structure', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      // Root widget container and header are rendered
      expect(screen.getByTestId('safe-shield-widget')).toBeInTheDocument()
      expect(screen.getByTestId('safe-shield-status')).toBeInTheDocument()
    })
  })

  describe('Header States', () => {
    it('counts the passed checks when all results are OK', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={mockContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('3 of 3 checks passed')).toBeInTheDocument()
    })

    it('counts the locked Pro checks, Safenet included, as not passed without Safe Pro', () => {
      mockSafenetState({ check: { shown: true, passed: false } })
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
          hasProFeatures={false}
        />,
      )

      expect(screen.getByText('1 of 3 checks passed')).toBeInTheDocument()
    })

    it('counts a Safenet verdict as a check', () => {
      mockSafenetState({ check: { shown: true, passed: true } })
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={mockContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('4 of 4 checks passed')).toBeInTheDocument()
    })

    it('shows a Safenet risk instead of "all checks passed"', () => {
      mockSafenetState({ risk: { severity: Severity.CRITICAL, title: 'Risk detected' } })
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={mockContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-status')).toHaveTextContent('Risk detected')
      expect(screen.queryByText(/checks passed/i)).not.toBeInTheDocument()
    })

    it('should show "Risk detected" when there are critical issues', () => {
      render(
        <SafeShieldDisplay
          recipient={mockCriticalRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('Risk detected')).toBeInTheDocument()
    })

    it('should show "Issues found" when there are warnings', () => {
      render(
        <SafeShieldDisplay
          recipient={mockWarningRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('Issues found')).toBeInTheDocument()
    })

    it('should show "Analyzing..." during loading', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) loadingRecipient[2] = true

      render(
        <SafeShieldDisplay
          recipient={loadingRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('Analyzing...')).toBeInTheDocument()
    })

    it('should show "Checks unavailable" on error', () => {
      const error = new Error('Analysis failed')
      const errorRecipient: AsyncResult<RecipientAnalysisResults> = [undefined, error, false]

      render(
        <SafeShieldDisplay
          recipient={errorRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('Checks unavailable')).toBeInTheDocument()
    })
  })

  describe('Content States', () => {
    it('should show loading state in content', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) loadingRecipient[2] = true

      render(
        <SafeShieldDisplay
          recipient={loadingRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error message in content', () => {
      const errorContract = ContractAnalysisBuilder.failedContract().build()

      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={errorContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText('Contract analysis failed')).toBeInTheDocument()
      expect(screen.getByText('Contract analysis failed. Review before processing.')).toBeInTheDocument()
    })

    it('should show empty state when no results', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(
        screen.getByText('Transaction details will be automatically scanned for potential risks and will appear here.'),
      ).toBeInTheDocument()
      expect(within(screen.getByTestId('safe-shield-widget')).getByTestId('safe-shield-logo')).toBeInTheDocument()
    })

    it('should not show loading state when data is present', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Props Integration', () => {
    it('should handle recipient results', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      // Header should show status
      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
      // Content should not show empty state
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle contract results', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={mockContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      // Header should show status
      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
      // Content should not show empty state
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle threat results', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
        />,
      )

      // Threat data is displayed with appropriate status
      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
      // Content should not show empty state when threat data is present
      expect(
        screen.queryByText(
          'Transaction details will be automatically scanned for potential risks and will appear here.',
        ),
      ).not.toBeInTheDocument()
    })

    it('should handle all props together', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={mockContract}
          threat={mockThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })
  })

  describe('Recipient card', () => {
    let safeAddress: string
    let recipient: string

    beforeEach(() => {
      safeAddress = fakerChecksummedAddress()
      recipient = fakerChecksummedAddress()
    })

    const findRecipientCard = () => screen.findByTestId('recipient-analysis-group-card')

    it('shows a recipient from the address book as known', async () => {
      mockRecipientServices({ isSafe: false, txCount: 10 })
      render(<RecipientShield safeAddress={safeAddress} recipient={recipient} addressBook={[recipient]} />)

      const card = await findRecipientCard()

      expect(within(card).getByText('Known recipient')).toBeInTheDocument()
      expect(within(card).getByText('This address is in your address book.')).toBeInTheDocument()
    })

    it('shows a Safe the user owns as known', async () => {
      mockRecipientServices({ isSafe: true, txCount: 10 })
      render(<RecipientShield safeAddress={safeAddress} recipient={recipient} ownedSafes={[recipient]} />)

      const card = await findRecipientCard()

      expect(within(card).getByText('Known recipient')).toBeInTheDocument()
      expect(within(card).getByText('This address is a Safe you own.')).toBeInTheDocument()
    })

    it('shows an address outside the address book and the owned Safes as unknown', async () => {
      mockRecipientServices({ isSafe: false, txCount: 10 })
      render(<RecipientShield safeAddress={safeAddress} recipient={recipient} />)

      const card = await findRecipientCard()

      expect(within(card).getByText('Unknown recipient')).toBeInTheDocument()
      expect(within(card).getByText('This address is not in your address book or a Safe you own.')).toBeInTheDocument()
    })

    it('warns about a recipient with fewer than five transactions', async () => {
      mockRecipientServices({ isSafe: false, txCount: 4 })
      render(<RecipientShield safeAddress={safeAddress} recipient={recipient} />)

      const card = await findRecipientCard()

      expect(await within(card).findByText('Low activity recipient')).toBeInTheDocument()
      expect(within(card).getByText('This address has few transactions.')).toBeInTheDocument()
    })

    it('does not warn about a recipient with five transactions', async () => {
      mockRecipientServices({ isSafe: false, txCount: 5 })
      render(<RecipientShield safeAddress={safeAddress} recipient={recipient} />)

      const card = await findRecipientCard()

      expect(within(card).getByText('Unknown recipient')).toBeInTheDocument()
      expect(screen.queryByText('Low activity recipient')).not.toBeInTheDocument()
    })
  })

  describe('No threat', () => {
    it('shows no threat detected, its details, and neither a malicious nor a failed result', async () => {
      const response: ThreatAnalysisResponseDto = {
        THREAT: [
          {
            severity: 'OK',
            type: 'NO_THREAT',
            title: 'No threat detected',
            description: 'Threat analysis found no issues.',
          },
        ],
      }
      const threat: AsyncResult<ThreatAnalysisResults> = [transformThreatAnalysisResponse(response), undefined, false]
      const { user } = renderWithUserEvent(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={threat}
          deadlock={emptyDeadlock}
        />,
      )

      const card = screen.getByTestId('threat-analysis-group-card')
      await user.click(within(card).getByText('No threat detected'))

      await waitFor(() => expect(within(card).getByText('Threat analysis found no issues.')).toBeVisible())
      expect(screen.queryByText('Malicious threat detected')).not.toBeInTheDocument()
      expect(screen.queryByText('Threat analysis failed')).not.toBeInTheDocument()
    })
  })

  describe('Malicious Threat Handling', () => {
    it('should handle malicious threat results with critical recipient', () => {
      const maliciousThreat = ThreatAnalysisBuilder.maliciousThreat()

      render(
        <SafeShieldDisplay
          threat={maliciousThreat}
          recipient={mockCriticalRecipient}
          contract={emptyContract}
          deadlock={emptyDeadlock}
        />,
      )

      // Header shows "Risk detected" from critical recipient, threat content is displayed
      expect(screen.getByText('Risk detected')).toBeInTheDocument()
      expect(screen.getByText('Malicious threat detected')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should always render the Safe Shield logo', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })

    it('should render logo even with errors', () => {
      const error = new Error('Analysis failed')
      const errorRecipient: AsyncResult<RecipientAnalysisResults> = [undefined, error, false]

      render(
        <SafeShieldDisplay
          recipient={errorRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })

    it('should render logo during loading', () => {
      const loadingRecipient = RecipientAnalysisBuilder.knownRecipient(mockRecipientAddress).build()
      if (loadingRecipient) {
        loadingRecipient[2] = true
      }

      render(
        <SafeShieldDisplay
          recipient={loadingRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.getByTestId('safe-shield-logo')).toBeInTheDocument()
    })
  })

  describe('Hypernative Authentication', () => {
    it('should show "Authentication required" when hypernativeAuth is provided and user is not authenticated', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
          hypernativeAuth={hypernativeAuthStatusBuilder().build()}
        />,
      )

      expect(screen.getByText('Authentication required')).toBeInTheDocument()
    })

    it('should show "Authentication required" when hypernativeAuth is provided and token is expired', () => {
      render(
        <SafeShieldDisplay
          recipient={emptyRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
          hypernativeAuth={hypernativeAuthStatusBuilder().with({ isAuthenticated: true, isTokenExpired: true }).build()}
        />,
      )

      expect(screen.getByText('Authentication required')).toBeInTheDocument()
    })

    it('should not show authentication required when hypernativeAuth is provided and user is authenticated', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
          hypernativeAuth={hypernativeAuthStatusBuilder()
            .with({ isAuthenticated: true, isTokenExpired: false })
            .build()}
        />,
      )

      expect(screen.queryByText('Authentication required')).not.toBeInTheDocument()
      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
    })

    it('should not show authentication required when hypernativeAuth is not provided', () => {
      render(
        <SafeShieldDisplay
          recipient={mockRecipient}
          contract={emptyContract}
          threat={emptyThreat}
          deadlock={emptyDeadlock}
        />,
      )

      expect(screen.queryByText('Authentication required')).not.toBeInTheDocument()
      expect(screen.getByText(/checks passed/i)).toBeInTheDocument()
    })
  })
})
