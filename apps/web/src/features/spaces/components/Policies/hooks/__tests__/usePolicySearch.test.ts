import { renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import usePolicySearch from '../usePolicySearch'
import { asActivePolicy, mockPolicies, mockProposerPolicy, mockSpendingLimitPolicy } from '../../mocks/policies'
import type { Policy } from '../../types'

const mockChains = [
  chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build(),
  chainBuilder().with({ chainId: '137', chainName: 'Polygon' }).build(),
]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
  useChain: (chainId: string) => mockChains.find((chain) => chain.chainId === chainId),
}))

// The shared fixtures are mostly zeros, which reads as one address to a fuzzy matcher.
const SPENDER = '0x9a2C4e5F7b1D3a6E8c0B2d4F6a8C1e3B5d7F9a1C'
const PROPOSER = '0x4B6d8F1a3C5e7B9d2F4a6C8e0B1d3F5a7C9e2B4D'

const chainIdsOf = (policies: Policy[]) => policies.map((policy) => policy.safe.chainId)

describe('usePolicySearch', () => {
  it('should, when the query is empty, return every policy unchanged', () => {
    const policies = mockPolicies()

    const { result } = renderHook(() => usePolicySearch(policies, ''))

    expect(result.current).toBe(policies)
  })

  it('should, when the query is a rule name, return only the policies of that type', () => {
    const { result } = renderHook(() => usePolicySearch(mockPolicies(), 'Proposer'))

    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.every((policy) => policy.type === 'proposer')).toBe(true)
  })

  it('should, when the query is part of a Safe address, return the policies on that Safe', () => {
    const policies = [
      asActivePolicy(
        mockProposerPolicy({ safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', chainId: '1' } }),
      ),
      asActivePolicy(
        mockProposerPolicy({ safe: { address: '0x1F2504De05f5167650bE5B28c472601Be434b60A', chainId: '1' } }),
      ),
    ]

    const { result } = renderHook(() => usePolicySearch(policies, '0x1F2504De'))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].safe.address).toBe('0x1F2504De05f5167650bE5B28c472601Be434b60A')
  })

  it('should, when the query is a spender address, return the policy that grants it', () => {
    const base = mockSpendingLimitPolicy()
    const spendingLimit = mockSpendingLimitPolicy({
      data: { spenders: [{ ...base.data.spenders[0], spender: SPENDER }] },
    })
    const policies = [asActivePolicy(spendingLimit), asActivePolicy(mockProposerPolicy())]

    const { result } = renderHook(() => usePolicySearch(policies, SPENDER))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].type).toBe('spending-limit')
  })

  it('should, when the query is a proposer address, return the grant naming it', () => {
    const proposer = mockProposerPolicy({
      data: { proposers: [{ proposer: PROPOSER, delegatedBy: [] }] },
    })
    const policies = [asActivePolicy(mockSpendingLimitPolicy()), asActivePolicy(proposer)]

    const { result } = renderHook(() => usePolicySearch(policies, PROPOSER))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].type).toBe('proposer')
  })

  it('should, when the query is a token symbol, return the spending limits on that token', () => {
    const { result } = renderHook(() => usePolicySearch(mockPolicies(), 'USDC'))

    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.every((policy) => policy.type === 'spending-limit')).toBe(true)
  })

  it('should, when the query is a network name, return the policies on that chain', () => {
    const { result } = renderHook(() => usePolicySearch(mockPolicies(), 'Polygon'))

    expect(result.current.length).toBeGreaterThan(0)
    expect(new Set(chainIdsOf(result.current))).toEqual(new Set(['137']))
  })

  it('should, when the query is a chain id, return the policies on that chain', () => {
    const policies = [
      asActivePolicy(
        mockSpendingLimitPolicy({
          id: 'a',
          safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', chainId: '1' },
        }),
      ),
      asActivePolicy(
        mockSpendingLimitPolicy({
          id: 'b',
          safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', chainId: '137' },
        }),
      ),
    ]

    const { result } = renderHook(() => usePolicySearch(policies, '137'))

    expect(chainIdsOf(result.current)).toEqual(['137'])
  })

  it('should, when the query changes, return the matches for the new query', () => {
    const policies = mockPolicies()
    const { result, rerender } = renderHook(({ query }: { query: string }) => usePolicySearch(policies, query), {
      initialProps: { query: 'Proposer' },
    })

    expect(result.current.every((policy) => policy.type === 'proposer')).toBe(true)

    rerender({ query: 'zzzznothing' })

    expect(result.current).toHaveLength(0)
  })
})
