import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChainsHook from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { MOCK_ADDRESSES, MOCK_SAFES, mockPolicies, mockProposerPolicy } from '../mocks/policies'
import SpacePoliciesPage from '../Page'

const mockUseSpacePolicies = jest.fn()
const mockUsePlanGate = jest.fn()
const mockUseSpacePlan = jest.fn()
const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, query: { spaceId: 'space-1' } }),
}))

jest.mock('../../../hooks/usePlanGate', () => ({
  usePlanGate: (gatingFlag: FEATURES) => mockUsePlanGate(gatingFlag),
}))

jest.mock('../../../hooks/useSpacePlan', () => ({
  useSpacePlan: (spaceId: string | null) => mockUseSpacePlan(spaceId),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/spaces'),
  useSpacesGetOneV1Query: () => ({ currentData: { name: 'Acme Inc' } }),
}))

jest.mock('../hooks/useSpacePolicies', () => ({
  useSpacePolicies: () => mockUseSpacePolicies(),
}))

jest.mock('../../AuthState', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../SpendingLimitFlow', () => ({
  __esModule: true,
  default: () => null,
}))

const settled = { policies: [], isLoading: false, isError: false, refetch: jest.fn() }
const PLANS_HREF = { pathname: '/spaces/plans', query: { spaceId: 'space-1' } }
const openGate = { mustUpgradeToSafePro: false, isLoading: false, upgradeHref: PLANS_HREF }
const lockedGate = { mustUpgradeToSafePro: true, isLoading: false, upgradeHref: PLANS_HREF }

describe('SpacePoliciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacePolicies.mockReturnValue(settled)
    mockUsePlanGate.mockReturnValue(openGate)
    mockUseSpacePlan.mockReturnValue({ tierName: 'Starter', isLoading: false })
  })

  it('should, while the policies load, render the loading state', () => {
    mockUseSpacePolicies.mockReturnValue({ ...settled, isLoading: true })

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
  })

  it('should, when the policies fail to load, render the error state and reload on request', () => {
    const refetch = jest.fn()
    mockUseSpacePolicies.mockReturnValue({ ...settled, isError: true, refetch })

    render(<SpacePoliciesPage spaceId="space-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

    expect(screen.getByTestId('policies-error')).toBeInTheDocument()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, when the space has no policies, render the catalogue', () => {
    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
  })

  it('should, when the space has policies, render them in the table', () => {
    mockUseSpacePolicies.mockReturnValue({ ...settled, policies: mockPolicies() })

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policies-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(6)
  })

  it('should, when a proposer is only in the local address book, show its local name in the table', () => {
    const proposers = [
      { proposer: MOCK_ADDRESSES.bob, delegatedBy: [{ delegator: MOCK_ADDRESSES.alice, label: 'Proposer' }] },
    ]
    mockUseSpacePolicies.mockReturnValue({ ...settled, policies: [mockProposerPolicy({ data: { proposers } })] })
    jest
      .spyOn(useChainsHook, 'useChain')
      .mockReturnValue(chainBuilder().with({ chainId: MOCK_SAFES.treasury.chainId }).build())

    render(<SpacePoliciesPage spaceId="space-1" />, {
      initialReduxState: { addressBook: { [MOCK_SAFES.treasury.chainId]: { [MOCK_ADDRESSES.bob]: 'Local Bob' } } },
    })

    expect(within(screen.getByTestId('policy-cell-proposer-tokens')).getByText('Local Bob')).toBeInTheDocument()
    jest.restoreAllMocks()
  })

  it('should, when the plan includes policies, render no upsell banner and skip reading the plan', () => {
    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.queryByTestId('policy-upsell-banner')).not.toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-suggestion')).toBeInTheDocument()
    expect(mockUseSpacePlan).toHaveBeenCalledWith(null)
  })

  it('should, when the plan does not include policies, render the banner naming the workspace and its plan', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policy-upsell-banner')).toHaveTextContent('Acme Inc is on Starter')
    expect(mockUseSpacePlan).toHaveBeenCalledWith('space-1')
  })

  it('should, when the banner button is clicked, open the plans page', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)

    render(<SpacePoliciesPage spaceId="space-1" />)
    fireEvent.click(screen.getByRole('button', { name: /Upgrade to Business/ }))

    expect(mockPush).toHaveBeenCalledWith(PLANS_HREF)
  })

  it('should, when the plan gate is read, gate on SAFE_PRO rather than the per-feature gating flags', () => {
    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(mockUsePlanGate).toHaveBeenCalledWith(FEATURES.SAFE_PRO)
    expect(mockUsePlanGate).not.toHaveBeenCalledWith(FEATURES.SPENDING_LIMIT_GATING)
    expect(mockUsePlanGate).not.toHaveBeenCalledWith(FEATURES.PROPOSER_GATING)
  })

  it('should, when the plan does not include policies, lock both policy tiles', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(
      within(screen.getByTestId('policy-catalogue-tile-spending-limit')).getByTestId('policy-locked-icon'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId('policy-catalogue-tile-proposer')).getByTestId('policy-locked-icon'),
    ).toBeInTheDocument()
  })

  it('should, when the space is locked, render no account counter on the tiles', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.queryByTestId('policy-account-count')).not.toBeInTheDocument()
  })

  it('should, while a plan gate loads, render the loading state and no banner', () => {
    mockUsePlanGate.mockReturnValue({ ...openGate, isLoading: true })

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('policy-upsell-banner')).not.toBeInTheDocument()
  })

  it('should, while the plan name loads for a locked space, render the loading state and no banner', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)
    mockUseSpacePlan.mockReturnValue({ tierName: undefined, isLoading: true })

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('policy-upsell-banner')).not.toBeInTheDocument()
  })

  it('should, when a locked space has policies, keep listing them under the banner', () => {
    mockUsePlanGate.mockReturnValue(lockedGate)
    mockUseSpacePolicies.mockReturnValue({ ...settled, policies: mockPolicies() })

    render(<SpacePoliciesPage spaceId="space-1" />)

    expect(screen.getByTestId('policy-upsell-banner')).toBeInTheDocument()
    expect(screen.getByTestId('policies-list')).toBeInTheDocument()
  })
})
