import { faker } from '@faker-js/faker'
import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo, mockChainId, mockWallet } from '@/tests/mocks/hooks'
import { getCurrentTotp } from '@/features/proposers/utils/totp'
import type { PendingDelegation } from '@/features/proposers/types'
import { usePendingDelegations } from '../../hooks/usePendingDelegations'
import PendingDelegationsList from '../PendingDelegationsList'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChainId')
jest.mock('../../hooks/usePendingDelegations')

const pendingDelegationBuilder = (overrides: Partial<PendingDelegation> = {}): PendingDelegation => ({
  messageHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
  action: 'add',
  delegateAddress: fakerChecksummedAddress(),
  nestedSafeAddress: fakerChecksummedAddress(),
  parentSafeAddress: fakerChecksummedAddress(),
  totp: getCurrentTotp(),
  status: 'pending',
  confirmationsSubmitted: 1,
  confirmationsRequired: 2,
  confirmations: [],
  preparedSignature: null,
  creationTimestamp: Date.now(),
  proposedBy: null,
  ...overrides,
})

const mockPendingDelegations = (pendingDelegations: PendingDelegation[], isLoading = false) =>
  jest.mocked(usePendingDelegations).mockReturnValue({ pendingDelegations, isLoading, refetch: jest.fn() })

describe('PendingDelegationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
    mockChainId('1')
    mockWallet({ chainId: '1' })
  })

  it('lists every pending delegation with its count', () => {
    mockPendingDelegations([
      pendingDelegationBuilder({ action: 'add' }),
      pendingDelegationBuilder({ action: 'remove', status: 'ready', confirmationsSubmitted: 2 }),
    ])

    render(<PendingDelegationsList />)

    expect(screen.getByText('Pending confirmations')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('New proposer:')).toBeInTheDocument()
    expect(screen.getByText('Remove proposer:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit delegation' })).toBeInTheDocument()
  })

  it('caps the count at 19+', () => {
    mockPendingDelegations(Array.from({ length: 20 }, () => pendingDelegationBuilder()))

    render(<PendingDelegationsList />)

    expect(screen.getByText('19+')).toBeInTheDocument()
  })

  it.each([
    ['there are no pending delegations', [], false],
    ['the delegations are loading', [pendingDelegationBuilder()], true],
  ])('renders nothing while %s', (_, delegations, isLoading) => {
    mockPendingDelegations(delegations, isLoading)

    const { container } = render(<PendingDelegationsList />)

    expect(container).toBeEmptyDOMElement()
  })

  it('keeps the other delegations visible when one cannot be rendered', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const malformed = { ...pendingDelegationBuilder(), confirmations: null } as unknown as PendingDelegation
    mockPendingDelegations([malformed, pendingDelegationBuilder({ action: 'remove' })])

    render(<PendingDelegationsList />)

    expect(screen.getByText('Failed to load this delegation.')).toBeInTheDocument()
    expect(screen.getByText('Remove proposer:')).toBeInTheDocument()
  })
})
