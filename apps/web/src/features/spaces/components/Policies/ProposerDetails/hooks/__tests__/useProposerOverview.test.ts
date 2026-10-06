import { renderHook } from '@testing-library/react'
import { asActivePolicy, MOCK_ADDRESSES, MOCK_SAFES, mockProposerPolicy } from '../../../mocks/policies'
import { useProposerOverview } from '../useProposerOverview'

const mockUseAddressBookItem = jest.fn()
const mockUseChain = jest.fn()

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string, chainId: string) => mockUseAddressBookItem(address, chainId),
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: (chainId: string) => mockUseChain(chainId),
}))

const policy = asActivePolicy(mockProposerPolicy())
const args = { policy, proposer: policy.data.proposers[0] }

describe('useProposerOverview', () => {
  beforeEach(() => {
    mockUseAddressBookItem.mockReturnValue(undefined)
    mockUseChain.mockReturnValue({ shortName: 'eth' })
  })

  it('should, when opened, name the proposer, the Safe and the granting owner from the address book', () => {
    mockUseAddressBookItem.mockImplementation((address: string) => {
      if (address === MOCK_ADDRESSES.bob) return { name: 'Robert' }
      if (address === MOCK_SAFES.treasury.address) return { name: 'Treasury' }
      if (address === MOCK_ADDRESSES.alice) return { name: 'Alice' }
      return undefined
    })

    const { result } = renderHook(() => useProposerOverview(args))

    expect(result.current).toEqual({
      proposer: { address: MOCK_ADDRESSES.bob, name: 'Robert' },
      appliesTo: {
        address: MOCK_SAFES.treasury.address,
        name: 'Treasury',
        href: { pathname: '/settings/setup', query: { safe: `eth:${MOCK_SAFES.treasury.address}` } },
      },
      initiatedBy: { address: MOCK_ADDRESSES.alice, name: 'Alice' },
      chainId: MOCK_SAFES.treasury.chainId,
      lastUpdated: 'Not available',
      enforcedBy: 'Safe{Wallet}',
    })
  })

  it('should, when the proposer has no address book entry, leave it unnamed instead of using the grant label', () => {
    const { result } = renderHook(() => useProposerOverview(args))

    expect(result.current.proposer.name).toBeUndefined()
  })

  it('should, when the chain is unknown, not link the Safe to its settings', () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderHook(() => useProposerOverview(args))

    expect(result.current.appliesTo.href).toBeUndefined()
  })
})
