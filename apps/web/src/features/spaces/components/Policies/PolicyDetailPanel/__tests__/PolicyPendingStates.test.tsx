import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { MOCK_ADDRESSES, mockPendingPolicy } from '../../mocks/policies'
import { mockConnectedWallet } from '../../mocks/wallet'
import PolicyDetailPanel from '../index'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseConnectWallet = useConnectWallet as jest.MockedFunction<typeof useConnectWallet>

const SIGNERS = [MOCK_ADDRESSES.alice, MOCK_ADDRESSES.bob]

beforeEach(() => {
  jest.clearAllMocks()
  mockUseConnectWallet.mockReturnValue(jest.fn())
})

describe('policy detail panel, pending states', () => {
  it('should, when a signer has not yet signed, warn that the policy is inactive and offer Sign transaction', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent(
      'The spending limit is not active as the transaction is not yet executed.',
    )
    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent(
      'Sign and execute the transaction to activate.',
    )
    expect(screen.getByRole('button', { name: 'Sign transaction' })).toBeInTheDocument()
  })

  it('should, when Sign transaction is used, report the policy to sign', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))
    const onSign = jest.fn()
    const policy = mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })

    render(<PolicyDetailPanel policy={policy} onClose={jest.fn()} signers={SIGNERS} onSign={onSign} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign transaction' }))

    expect(onSign).toHaveBeenCalledWith(policy)
  })

  it('should, when no wallet is connected, offer Connect wallet instead of Sign transaction', () => {
    mockUseWallet.mockReturnValue(null)

    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign transaction' })).not.toBeInTheDocument()
  })

  it('should, when Connect wallet is clicked, open the wallet-connect dialog', () => {
    mockUseWallet.mockReturnValue(null)
    const connectWallet = jest.fn()
    mockUseConnectWallet.mockReturnValue(connectWallet)

    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }))

    expect(connectWallet).toHaveBeenCalledTimes(1)
  })

  it('should, when a signer wallet connects while the panel is open, offer Sign transaction', () => {
    mockUseWallet.mockReturnValue(null)
    const policy = mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })

    const { rerender } = render(<PolicyDetailPanel policy={policy} onClose={jest.fn()} signers={SIGNERS} />)

    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))
    rerender(<PolicyDetailPanel policy={policy} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.getByRole('button', { name: 'Sign transaction' })).toBeInTheDocument()
  })

  it('should, when the connected wallet is not a signer, say who can sign and offer no action', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.unresolved))

    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.getByTestId('policy-pending-footer')).toHaveTextContent(
      'Only signers of this Safe account can sign this transaction.',
    )
    expect(screen.queryByRole('button', { name: 'Sign transaction' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Execute transaction' })).not.toBeInTheDocument()
  })

  it('should, when the signer has signed and one signature is outstanding, name that one signature', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 2 })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent(
      "You've signed. Waiting for 1 more signature.",
    )
    expect(screen.getByRole('button', { name: 'Copy transaction link' })).toBeInTheDocument()
  })

  it('should, when the signer has signed and three signatures are outstanding, use the plural', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 4 })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent(
      "You've signed. Waiting for 3 more signatures.",
    )
  })

  it('should, when Copy transaction link is used, copy the link and confirm it', async () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ confirmationsSubmitted: 1, confirmationsRequired: 2 })}
        onClose={jest.fn()}
        signers={SIGNERS}
        transactionLink="https://app.safe.global/transactions/tx?id=0x9f3c"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy transaction link' }))

    expect(writeText).toHaveBeenCalledWith('https://app.safe.global/transactions/tx?id=0x9f3c')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument())
  })

  it('should, when every required signature is in, offer Execute transaction', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ confirmationsSubmitted: 2, confirmationsRequired: 2, missingSigners: [] })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent('Execute the transaction to activate.')
    expect(screen.getByRole('button', { name: 'Execute transaction' })).toBeInTheDocument()
  })

  it('should, when signatures are still outstanding, offer no Execute transaction', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ missingSigners: [MOCK_ADDRESSES.bob] })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Execute transaction' })).not.toBeInTheDocument()
  })

  it('should, when Execute transaction is used, report the policy to execute', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))
    const onExecute = jest.fn()
    const policy = mockPendingPolicy({ confirmationsSubmitted: 2, confirmationsRequired: 2, missingSigners: [] })

    render(<PolicyDetailPanel policy={policy} onClose={jest.fn()} signers={SIGNERS} onExecute={onExecute} />)
    fireEvent.click(screen.getByRole('button', { name: 'Execute transaction' }))

    expect(onExecute).toHaveBeenCalledWith(policy)
  })

  it('should, when the queued transaction can no longer be used, say so and offer no action', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} isTransactionUnavailable />,
    )

    expect(screen.getByTestId('policy-pending-footer')).toHaveTextContent(
      'This transaction can no longer be signed or executed.',
    )
    expect(screen.queryByRole('button', { name: 'Sign transaction' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Execute transaction' })).not.toBeInTheDocument()
  })

  it('should, when the queued transaction removes the policy, warn that the policy is still active', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))

    render(
      <PolicyDetailPanel
        policy={mockPendingPolicy({ operation: 'remove', missingSigners: [MOCK_ADDRESSES.bob] })}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.getByTestId('policy-pending-banner')).toHaveTextContent(
      'The spending limit stays active until the removal transaction is executed.',
    )
  })

  it('should, when the policy is active, render no pending banner or footer', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel
        policy={{ ...mockPendingPolicy(), status: 'active', enabled: true }}
        onClose={jest.fn()}
        signers={SIGNERS}
      />,
    )

    expect(screen.queryByTestId('policy-pending-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('policy-pending-footer')).not.toBeInTheDocument()
  })
})
