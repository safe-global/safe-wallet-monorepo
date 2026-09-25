import { renderHook } from '@testing-library/react'
import { asActivePolicy, MOCK_ADDRESSES, MOCK_SAFES, mockProposerPolicy } from '../../../mocks/policies'
import { ProposerStatus } from '../../../ProposerDrawer'
import { useActiveProposer } from '../useActiveProposer'

const mockUseWallet = jest.fn()
const mockConnectWallet = jest.fn()

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string) => (address === MOCK_SAFES.treasury.address ? { name: 'Treasury' } : undefined),
}))

const policy = asActivePolicy(mockProposerPolicy())
const onRemove = jest.fn()
const args = { policy, proposer: policy.data.proposers[0], onRemove }

describe('useActiveProposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: MOCK_ADDRESSES.alice })
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

  it('should, when the wallet did not grant the role, disable the remove action and say why', () => {
    mockUseWallet.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' })

    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({
      actionLabel: 'Remove proposer',
      actionDisabled: true,
      actionHint: 'Only the signer who granted this proposer role can remove it',
    })
  })

  it('should, when the wallet granted the role, enable the remove action', () => {
    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({ actionLabel: 'Remove proposer', actionDisabled: false })
    expect(result.current.actionHint).toBeUndefined()
  })

  it('should, when the wallet is the proposer itself, enable the remove action', () => {
    mockUseWallet.mockReturnValue({ address: MOCK_ADDRESSES.bob })

    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current).toMatchObject({ actionDisabled: false })
  })

  it('should, when the delegator clicks Remove proposer, ask to confirm the removal', () => {
    const { result } = renderHook(() => useActiveProposer(args))
    result.current.onAction()

    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
