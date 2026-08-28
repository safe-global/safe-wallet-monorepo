import { fireEvent, render, screen, within } from '@/tests/test-utils'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import {
  MOCK_ADDRESSES,
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
} from '../../mocks/policies'
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

describe('policy detail panel, active states', () => {
  it('should, when the connected wallet is a signer, enable both Delete and Edit and explain nothing', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
    expect(screen.queryByText(/Only signers of this Safe account/)).not.toBeInTheDocument()
  })

  it('should, when a signer uses Edit or Delete, report the policy to act on', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const policy = asActivePolicy(mockSpendingLimitPolicy())

    render(
      <PolicyDetailPanel policy={policy} onClose={jest.fn()} signers={SIGNERS} onEdit={onEdit} onDelete={onDelete} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onEdit).toHaveBeenCalledWith(policy)
    expect(onDelete).toHaveBeenCalledWith(policy)
  })

  it('should, when no wallet is connected, offer Connect wallet instead of Delete and Edit', () => {
    mockUseWallet.mockReturnValue(null)

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.getByText('Connect a signer wallet to edit.')).toBeInTheDocument()
  })

  it('should, when Connect wallet is clicked, open the wallet-connect dialog', () => {
    mockUseWallet.mockReturnValue(null)
    const connectWallet = jest.fn()
    mockUseConnectWallet.mockReturnValue(connectWallet)

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }))

    expect(connectWallet).toHaveBeenCalledTimes(1)
  })

  it('should, when a signer wallet connects while the panel is open, offer Delete and Edit', () => {
    mockUseWallet.mockReturnValue(null)

    const { rerender } = render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))
    rerender(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  it('should, when the connected wallet is not a signer, disable Delete and Edit and say who can act', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.unresolved))

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(
      screen.getByText('Only signers of this Safe account can delete or edit this spending limit.'),
    ).toBeInTheDocument()
  })

  it('should, when the connected wallet is not a signer of a recovery, name the recovery policy', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.unresolved))

    render(<PolicyDetailPanel policy={asActivePolicy(mockRecoveryPolicy())} onClose={jest.fn()} signers={SIGNERS} />)

    expect(
      screen.getByText('Only signers of this Safe account can delete or edit this recovery policy.'),
    ).toBeInTheDocument()
  })

  it('should, when the signer who granted a proposer is no longer an owner, disable Delete and say why', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.bob))

    render(
      <PolicyDetailPanel
        policy={asActivePolicy(mockProposerPolicy())}
        onClose={jest.fn()}
        signers={[MOCK_ADDRESSES.bob]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByText(/no longer an owner of this Safe account/)).toBeInTheDocument()
  })

  it('should, when the signer who granted a proposer is still an owner, enable Delete for a signer', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(<PolicyDetailPanel policy={asActivePolicy(mockProposerPolicy())} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()
  })

  it('should, when the policy is active, show each allowance with a bar, what is left and the next reset', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    const usage = screen.getAllByTestId('allowance-usage')[0]

    expect(within(usage).getByRole('progressbar')).toBeInTheDocument()
    expect(within(usage).getByText('500 USDC remaining')).toBeInTheDocument()
    expect(within(usage).getByText('Resets Oct 1, 00:00 UTC')).toBeInTheDocument()
  })

  it('should, when the policy has three spenders, show usage for every token of every spender', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockMultiSpenderPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getAllByTestId('allowance-usage')).toHaveLength(4)
  })

  it('should, when an allowance is fully spent, mark what is left differently from an untouched one', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(
      <PolicyDetailPanel policy={asActivePolicy(mockMultiSpenderPolicy())} onClose={jest.fn()} signers={SIGNERS} />,
    )

    expect(screen.getByText('0 UNKNOWN remaining')).toHaveClass('text-destructive')
    expect(screen.getByText('5,000 USDC remaining')).not.toHaveClass('text-destructive')
  })

  it('should, when the policy is pending, show the allowance amounts without usage bars', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.queryByTestId('allowance-usage')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('policy-allowance')).toHaveLength(2)
  })

  it('should, when the policy is pending, render no Delete or Edit footer', () => {
    mockUseWallet.mockReturnValue(mockConnectedWallet(MOCK_ADDRESSES.alice))

    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} signers={SIGNERS} />)

    expect(screen.queryByTestId('policy-active-footer')).not.toBeInTheDocument()
  })
})
