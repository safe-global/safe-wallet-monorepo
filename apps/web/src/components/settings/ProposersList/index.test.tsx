import { render } from '@/tests/test-utils'
import ProposersList from '.'
import { faker } from '@faker-js/faker'
import useProposers from '@/hooks/useProposers'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { mockRole } from '@/tests/mocks/roles'
import { FEATURES } from '@safe-global/utils/utils/chains'

const NOT_CONNECTED = 'Please connect your wallet'
const NOT_OWNER = 'Your connected wallet is not a signer of this Safe account'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')

jest.mock('@/features/spending-limits', () => ({
  __esModule: true,
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
}))

const mockUsePlanGate = jest.fn()
jest.mock('@/features/spaces/hooks/usePlanGate', () => ({
  usePlanGate: (...args: unknown[]) => mockUsePlanGate(...args),
}))

jest.mock('@/hooks/useNestedSafeOwners')
const mockUseNestedSafeOwners = useNestedSafeOwners as jest.MockedFunction<typeof useNestedSafeOwners>

const mockSafeAddress = faker.finance.ethereumAddress()
const mockOwnerAddress = faker.finance.ethereumAddress()

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safeAddress: mockSafeAddress,
    safe: {
      address: { value: mockSafeAddress },
      chainId: '1',
      owners: [{ value: mockOwnerAddress }],
      threshold: 1,
      deployed: true,
    },
    safeLoaded: true,
  })),
}))

describe('ProposersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRole('owner')
    mockUseNestedSafeOwners.mockReturnValue([])
    mockUsePlanGate.mockReturnValue({ mustUpgradeToSafePro: false, isLoading: false, upgradeHref: '/spaces/plans' })
    ;(useHasFeature as jest.MockedFunction<typeof useHasFeature>).mockReturnValue(true)
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ deployed: true })
        .with({ owners: [{ value: mockOwnerAddress }] })
        .build(),
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfo>)
    ;(useProposers as jest.MockedFunction<typeof useProposers>).mockReturnValue({
      data: { results: [] },
    } as unknown as ReturnType<typeof useProposers>)
  })

  it.each(['owner', 'nestedOwner', 'proposerAndOwner'] as const)(
    'should enable the Add proposer button for %s',
    (role) => {
      mockRole(role)

      const { getByTestId } = render(<ProposersList />)

      expect(getByTestId('add-proposer-btn')).toBeEnabled()
    },
  )

  it.each([
    ['proposer', NOT_OWNER],
    ['nonOwner', NOT_OWNER],
    ['disconnected', NOT_CONNECTED],
  ] as const)('should disable the Add proposer button for %s with the reason "%s"', (role, reason) => {
    mockRole(role)

    const { getByTestId, getByLabelText } = render(<ProposersList />)

    expect(getByTestId('add-proposer-btn')).toBeDisabled()
    expect(getByLabelText(reason)).toBeInTheDocument()
  })

  it('marks the Add proposer button with the Pro tag only when the plan gate asks for it', () => {
    const { getByTestId, queryByTestId, rerender } = render(<ProposersList />)
    expect(queryByTestId('pro-tag')).not.toBeInTheDocument()

    mockUsePlanGate.mockReturnValue({
      mustUpgradeToSafePro: false,
      isLoading: false,
      showProTag: true,
      upgradeHref: '/spaces/plans',
    })
    rerender(<ProposersList />)

    expect(getByTestId('add-proposer-btn')).toContainElement(getByTestId('pro-tag'))
  })

  it('should disable the Add proposer button when Safe is undeployed', () => {
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ deployed: false })
        .with({ owners: [{ value: mockOwnerAddress }] })
        .build(),
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfo>)

    const { getByTestId } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).toBeDisabled()
  })

  it('replaces the Add proposer button with the Safe Pro lock while the plan gate blocks it', () => {
    mockUsePlanGate.mockReturnValue({ mustUpgradeToSafePro: true, isLoading: false, upgradeHref: '/spaces/plans' })

    const { getByRole, getByTestId, queryByTestId } = render(<ProposersList />)

    expect(mockUsePlanGate).toHaveBeenCalledWith(FEATURES.PROPOSER_GATING)
    expect(queryByTestId('add-proposer-btn')).not.toBeInTheDocument()
    expect(getByTestId('safe-pro-lock')).toHaveTextContent('Existing ones stay active.')
    expect(getByRole('link', { name: 'Explore Safe Pro' })).toHaveAttribute('href', '/spaces/plans')
  })

  it('renders neither the button nor the lock while the plan gate is loading', () => {
    mockUsePlanGate.mockReturnValue({ mustUpgradeToSafePro: false, isLoading: true, upgradeHref: '/spaces/plans' })

    const { queryByTestId } = render(<ProposersList />)

    expect(queryByTestId('add-proposer-btn')).not.toBeInTheDocument()
    expect(queryByTestId('safe-pro-lock')).not.toBeInTheDocument()
  })
})
