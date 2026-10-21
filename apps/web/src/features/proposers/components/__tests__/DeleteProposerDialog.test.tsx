import { faker } from '@faker-js/faker'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import DeleteProposerDialog from '../DeleteProposerDialog'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useNestedSafeOwners')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const proposerBuilder = (overrides: Partial<Delegate> = {}): Delegate => ({
  delegate: fakerChecksummedAddress(),
  delegator: fakerChecksummedAddress(),
  label: faker.person.firstName(),
  ...overrides,
})

const mockConnectedRole = (role: TestRole) => {
  const wallet = mockRole(role)
  if (!wallet) throw new Error(`The ${role} role has no connected wallet`)
  return wallet.address
}

const getDeleteButton = () => screen.getByTestId('delete-proposer-btn')

describe('DeleteProposerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
    jest.mocked(useNestedSafeOwners).mockReturnValue([])
  })

  it('enables delete for the delegate', () => {
    const walletAddress = mockConnectedRole('proposer')

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegate: walletAddress })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it('enables delete for the delegator', () => {
    const walletAddress = mockConnectedRole('owner')

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: walletAddress })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it('enables delete for a nested Safe owner whose parent Safe is the delegator', () => {
    const parentSafeAddress = fakerChecksummedAddress()
    mockRole('nestedOwner')
    jest.mocked(useNestedSafeOwners).mockReturnValue([parentSafeAddress])

    render(<DeleteProposerDialog proposer={proposerBuilder({ delegator: parentSafeAddress })} />)

    expect(getDeleteButton()).toBeEnabled()
  })

  it.each(['owner', 'proposer', 'nestedOwner', 'disconnected'] as const)(
    'disables delete for %s who is neither the delegate nor the delegator',
    (role) => {
      mockRole(role)

      render(<DeleteProposerDialog proposer={proposerBuilder()} />)

      expect(getDeleteButton()).toBeDisabled()
    },
  )
})
