import { renderHook } from '@testing-library/react'
import { asActivePolicy, MOCK_ADDRESSES, MOCK_SAFES, mockProposerPolicy } from '../../../mocks/policies'
import { ProposerStatus } from '../../../ProposerDrawer'
import { REMOVE_NESTED_PROPOSER_HINT, useActiveProposer } from '../useActiveProposer'

const mockUseWallet = jest.fn()
const mockConnectWallet = jest.fn()
const mockUseNestedSafeGrantor = jest.fn()
const PARENT_SAFE = '0x2222222222222222222222222222222222222222'

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string) => {
    if (address === MOCK_SAFES.treasury.address) return { name: 'Treasury' }
    if (address === PARENT_SAFE) return { name: 'Ops' }
    return undefined
  },
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: () => ({ shortName: 'eth' }),
}))

jest.mock('../useNestedSafeGrantor', () => ({
  useNestedSafeGrantor: () => mockUseNestedSafeGrantor(),
}))

const policy = asActivePolicy(mockProposerPolicy())
const onRemove = jest.fn()
const args = { policy, proposer: policy.data.proposers[0], onRemove }

describe('useActiveProposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: MOCK_ADDRESSES.alice })
    mockUseNestedSafeGrantor.mockReturnValue(undefined)
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
      actionHint: 'Only the signer who granted this proposer role, or the proposer themselves, can remove it',
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

  describe('when a parent Safe granted the role', () => {
    const nestedPolicy = asActivePolicy(
      mockProposerPolicy({
        data: {
          proposers: [{ proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: PARENT_SAFE, label: 'Bob' }] }],
        },
      }),
    )
    const nestedArgs = { policy: nestedPolicy, proposer: nestedPolicy.data.proposers[0], onRemove }

    beforeEach(() => {
      mockUseNestedSafeGrantor.mockReturnValue(PARENT_SAFE)
    })

    it('should point to the Safe settings and disable the remove action', () => {
      const { result } = renderHook(() => useActiveProposer(nestedArgs))

      expect(result.current).toMatchObject({
        actionLabel: 'Remove proposer',
        actionDisabled: true,
        actionHint: REMOVE_NESTED_PROPOSER_HINT,
        nestedSafeGrant: {
          safeName: 'Treasury',
          parentSafeName: 'Ops',
          settingsHref: { pathname: '/settings/setup', query: { safe: `eth:${MOCK_SAFES.treasury.address}` } },
        },
      })
    })

    it('should, even for the proposer itself, disable the remove action', () => {
      mockUseWallet.mockReturnValue({ address: MOCK_ADDRESSES.bob })

      const { result } = renderHook(() => useActiveProposer(nestedArgs))

      expect(result.current).toMatchObject({ actionDisabled: true, actionHint: REMOVE_NESTED_PROPOSER_HINT })
    })

    it('should, when no wallet is connected, still show where to remove it', () => {
      mockUseWallet.mockReturnValue(null)

      const { result } = renderHook(() => useActiveProposer(nestedArgs))

      expect(result.current).toMatchObject({
        actionLabel: 'Connect wallet',
        nestedSafeGrant: { parentSafeName: 'Ops' },
      })
    })

    it('should, when the wallet also granted the role itself, keep the remove action and skip the notice', () => {
      const policyWithOwnGrant = asActivePolicy(
        mockProposerPolicy({
          data: {
            proposers: [
              {
                proposer: MOCK_ADDRESSES.bob,
                delegatedBy: [
                  { delegator: PARENT_SAFE, label: 'Bob' },
                  { delegator: MOCK_ADDRESSES.alice, label: 'Bob' },
                ],
              },
            ],
          },
        }),
      )

      const { result } = renderHook(() =>
        useActiveProposer({ policy: policyWithOwnGrant, proposer: policyWithOwnGrant.data.proposers[0], onRemove }),
      )

      expect(result.current).toMatchObject({ actionDisabled: false })
      expect(result.current.nestedSafeGrant).toBeUndefined()
    })
  })

  it('should, when every grant comes from an EOA, show no nested Safe notice', () => {
    const { result } = renderHook(() => useActiveProposer(args))

    expect(result.current.nestedSafeGrant).toBeUndefined()
  })
})
