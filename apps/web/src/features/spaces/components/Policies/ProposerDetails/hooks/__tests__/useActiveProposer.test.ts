import { renderHook } from '@testing-library/react'
import { asActivePolicy, MOCK_SAFES, mockProposerPolicy } from '../../../mocks/policies'
import { ProposerStatus } from '../../../ProposerDrawer'
import { useActiveProposer } from '../useActiveProposer'

const mockUseWallet = jest.fn()
const mockConnectWallet = jest.fn()
const mockOwnedByChain = jest.fn()

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

jest.mock('../../../../../hooks/useSpaceSafeOverviews', () => ({
  useSpaceSafeOverviews: () => ({ ownedByChain: mockOwnedByChain(), isOwnershipResolved: true }),
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string) => (address === MOCK_SAFES.treasury.address ? { name: 'Treasury' } : undefined),
}))

const policy = asActivePolicy(mockProposerPolicy())
const args = { policy, proposer: policy.data.proposers[0] }

describe('useActiveProposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' })
    mockOwnedByChain.mockReturnValue({})
  })

  it('should, when no wallet is connected, offer to connect one', () => {
    mockUseWallet.mockReturnValue(null)

    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({
      status: ProposerStatus.ACTIVE,
      actionLabel: 'Connect wallet',
      actionHint: 'Connect a signer wallet of Treasury to edit.',
      onAction: mockConnectWallet,
    })
  })

  it('should, when the wallet does not sign for the Safe, disable the remove action and say why', () => {
    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({
      actionLabel: 'Remove proposer',
      actionDisabled: true,
      actionHint: 'Only signers of Treasury can delete or edit this Proposer role.',
    })
  })

  it('should, when the wallet signs for the Safe, enable the remove action', () => {
    mockOwnedByChain.mockReturnValue({ [MOCK_SAFES.treasury.chainId]: [MOCK_SAFES.treasury.address] })

    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({ actionLabel: 'Remove proposer', actionDisabled: false })
    expect(result.current.actionHint).toBeUndefined()
  })
})
