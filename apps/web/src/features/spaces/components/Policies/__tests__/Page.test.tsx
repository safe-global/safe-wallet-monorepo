import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { AppRoutes } from '@/config/routes'
import SpacePoliciesPage from '../Page'
import { mockStarterPlan } from '../mocks/plan'

const mockUsePolicyLock = jest.fn()
const mockUsePolicyUpgrade = jest.fn()
const mockPush = jest.fn()
const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))
jest.mock('../../AuthState', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('../hooks/usePolicyLock', () => ({ usePolicyLock: (spaceId: string) => mockUsePolicyLock(spaceId) }))
jest.mock('../hooks/usePolicyUpgrade', () => ({
  usePolicyUpgrade: (spaceId: string) => mockUsePolicyUpgrade(spaceId),
}))
jest.mock('../../Plans/ChangePlanFlow', () => ({
  __esModule: true,
  default: ({ pick, onClose }: { pick: { tier: { name: string } }; onClose: () => void }) => (
    <div data-testid="change-plan-flow" data-to={pick.tier.name}>
      <button onClick={onClose}>close-flow</button>
    </div>
  ),
}))

const SPACE_ID = 'space-1'
const businessPick = { tier: { name: 'Business' }, option: { seats: 20 } }
const currentPlan = { name: 'Starter', price: 149 }

describe('SpacePoliciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePolicyLock.mockReturnValue({ isResolving: false })
    mockUsePolicyUpgrade.mockReturnValue({
      pick: businessPick,
      currentPlan,
      isOpen: false,
      open: mockOpen,
      close: mockClose,
    })
  })

  it("should, when the plan includes policies, render today's page without a banner", () => {
    render(<SpacePoliciesPage spaceId={SPACE_ID} />)

    expect(screen.getByTestId('policy-catalogue')).toBeInTheDocument()
    expect(screen.getByTestId('policy-catalogue-tile-suggestion')).toBeInTheDocument()
    expect(screen.queryByTestId('policy-upsell-banner')).not.toBeInTheDocument()
    expect(mockUsePolicyLock).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUsePolicyUpgrade).toHaveBeenCalledWith(SPACE_ID)
  })

  it('should, while the plan is still being read, render the loading state and no banner', () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: true })

    render(<SpacePoliciesPage spaceId={SPACE_ID} />)

    expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('policy-upsell-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('policy-catalogue')).not.toBeInTheDocument()
  })

  it('should, when the plan does not include policies, render the banner and the gated tiles', () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: false, lock: mockStarterPlan })

    render(<SpacePoliciesPage spaceId={SPACE_ID} />)

    expect(screen.getByTestId('policy-upsell-banner')).toHaveTextContent('Acme Inc is on Starter')
    expect(screen.getAllByTestId('policy-account-count')).toHaveLength(2)
    expect(screen.queryByTestId('policy-catalogue-tile-suggestion')).not.toBeInTheDocument()
  })

  it('should, when Upgrade to Business is clicked and Business is on offer, open the plan-change flow', async () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: false, lock: mockStarterPlan })
    const { user } = renderWithUserEvent(<SpacePoliciesPage spaceId={SPACE_ID} />)

    await user.click(screen.getByRole('button', { name: /Upgrade to Business/ }))

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should, when a gated tile is clicked and Business is on offer, open the plan-change flow', async () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: false, lock: mockStarterPlan })
    const { user } = renderWithUserEvent(<SpacePoliciesPage spaceId={SPACE_ID} />)

    await user.click(screen.getByRole('button', { name: 'Set policy: Proposer' }))

    expect(mockOpen).toHaveBeenCalledTimes(1)
  })

  it('should, when the flow is open, render it towards Business and close it from its own control', async () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: false, lock: mockStarterPlan })
    mockUsePolicyUpgrade.mockReturnValue({
      pick: businessPick,
      currentPlan,
      isOpen: true,
      open: mockOpen,
      close: mockClose,
    })
    const { user } = renderWithUserEvent(<SpacePoliciesPage spaceId={SPACE_ID} />)

    expect(screen.getByTestId('change-plan-flow')).toHaveAttribute('data-to', 'Business')

    await user.click(screen.getByRole('button', { name: 'close-flow' }))

    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should, when Upgrade to Business is clicked and no Business offer is in, send the user to the Plans page', async () => {
    mockUsePolicyLock.mockReturnValue({ isResolving: false, lock: mockStarterPlan })
    mockUsePolicyUpgrade.mockReturnValue({
      pick: undefined,
      currentPlan: undefined,
      isOpen: false,
      open: mockOpen,
      close: mockClose,
    })
    const { user } = renderWithUserEvent(<SpacePoliciesPage spaceId={SPACE_ID} />)

    await user.click(screen.getByRole('button', { name: /Upgrade to Business/ }))

    expect(mockOpen).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith({ pathname: AppRoutes.spaces.plans, query: { spaceId: SPACE_ID } })
  })
})
