import { render, screen } from '@/tests/test-utils'
import * as spaces from '@/features/spaces'
import * as useActivePoliciesHook from '../useActivePolicies'
import { spendingLimitPolicyBuilder, tokenWithdrawPolicyBuilder } from '@/tests/builders/policies'
import ActivePoliciesList from '../ActivePoliciesList'

const SAFE = { chainId: '1', address: '0x1111111111111111111111111111111111111111', name: 'Ops Safe' }

// useSpaceSafes returns grouped safe items; a single-chain entry is enough here.
const mockSpaceSafes = (safes: unknown[]) =>
  jest.spyOn(spaces, 'useSpaceSafes').mockReturnValue({
    allSafes: safes,
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  } as never)

const mockActivePolicies = (overrides: Partial<ReturnType<typeof useActivePoliciesHook.useActivePolicies>>) =>
  jest.spyOn(useActivePoliciesHook, 'useActivePolicies').mockReturnValue({
    policies: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  })

describe('ActivePoliciesList', () => {
  afterEach(() => jest.restoreAllMocks())

  it('renders nothing when the space has no safes', () => {
    mockSpaceSafes([])
    mockActivePolicies({})
    const { container } = render(<ActivePoliciesList />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a card per safe with its active policies', () => {
    mockSpaceSafes([SAFE])
    mockActivePolicies({ policies: [spendingLimitPolicyBuilder().build(), tokenWithdrawPolicyBuilder().build()] })

    render(<ActivePoliciesList />)

    expect(screen.getByText('Ops Safe')).toBeInTheDocument()
    // Shortened address is shown alongside the name.
    expect(screen.getByText('0x1111...1111')).toBeInTheDocument()
    expect(screen.getByText('Spending limit')).toBeInTheDocument()
    expect(screen.getByText('Token withdraw allowlist')).toBeInTheDocument()
  })

  it('does not render a card for a safe with no active policies', () => {
    mockSpaceSafes([SAFE])
    mockActivePolicies({ policies: [] })

    render(<ActivePoliciesList />)
    expect(screen.queryByText('Ops Safe')).not.toBeInTheDocument()
  })

  it('does not render a card while loading', () => {
    mockSpaceSafes([SAFE])
    mockActivePolicies({ isLoading: true })

    render(<ActivePoliciesList />)
    expect(screen.queryByText('Ops Safe')).not.toBeInTheDocument()
  })

  it('does not render a card on error', () => {
    mockSpaceSafes([SAFE])
    mockActivePolicies({ isError: true })

    render(<ActivePoliciesList />)
    expect(screen.queryByText('Ops Safe')).not.toBeInTheDocument()
  })
})
