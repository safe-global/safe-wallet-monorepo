import { fireEvent, render, screen } from '@/tests/test-utils'
import { asActivePolicy, MOCK_ADDRESSES, MOCK_SAFES, mockProposerPolicy } from '../../mocks/policies'
import ProposerDetails from '../index'

const mockUseWallet = jest.fn()
const mockConnectWallet = jest.fn()
const mockOwnedByChain = jest.fn()
const mockUseAddressBookItem = jest.fn()

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

jest.mock('../../../../hooks/useSpaceSafeOverviews', () => ({
  useSpaceSafeOverviews: () => ({ ownedByChain: mockOwnedByChain(), isOwnershipResolved: true }),
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string, chainId: string) => mockUseAddressBookItem(address, chainId),
}))

const policy = asActivePolicy(mockProposerPolicy())
const proposer = policy.data.proposers[0]

describe('ProposerDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' })
    mockOwnedByChain.mockReturnValue({})
    mockUseAddressBookItem.mockReturnValue(undefined)
  })

  it('should, when opened, name the proposer, the Safe it applies to and the owner who granted it', () => {
    mockUseAddressBookItem.mockImplementation((address: string) => {
      if (address === MOCK_SAFES.treasury.address) return { name: 'Treasury' }
      if (address === MOCK_ADDRESSES.alice) return { name: 'Alice' }
      return undefined
    })

    render(<ProposerDetails policy={policy} proposer={proposer} onClose={jest.fn()} />)

    expect(screen.getByText('Proposer role')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Safe{Wallet}')).toBeInTheDocument()
  })

  it('should, when the proposer has an address book entry, prefer it over the grant label', () => {
    mockUseAddressBookItem.mockImplementation((address: string) =>
      address === MOCK_ADDRESSES.bob ? { name: 'Robert' } : undefined,
    )

    render(<ProposerDetails policy={policy} proposer={proposer} onClose={jest.fn()} />)

    expect(screen.getByText('Robert')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('should, when no wallet is connected, offer to connect one', () => {
    mockUseWallet.mockReturnValue(null)

    render(<ProposerDetails policy={policy} proposer={proposer} onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }))

    expect(mockConnectWallet).toHaveBeenCalledTimes(1)
  })

  it('should, when the wallet does not sign for the Safe, keep the remove action out of reach', () => {
    render(<ProposerDetails policy={policy} proposer={proposer} onClose={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Remove proposer' })).toBeDisabled()
    expect(screen.getByText(/Only signers of/)).toBeInTheDocument()
  })

  it('should, when the wallet signs for the Safe, enable the remove action', () => {
    mockOwnedByChain.mockReturnValue({ [MOCK_SAFES.treasury.chainId]: [MOCK_SAFES.treasury.address] })

    render(<ProposerDetails policy={policy} proposer={proposer} onClose={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Remove proposer' })).toBeEnabled()
    expect(screen.queryByText(/Only signers of/)).not.toBeInTheDocument()
  })
})
