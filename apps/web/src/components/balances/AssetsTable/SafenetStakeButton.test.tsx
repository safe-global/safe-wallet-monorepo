import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import SafenetStakeButton from './SafenetStakeButton'

const mockOpenSafenetStakingApp = jest.fn()
let mockIsNavigating = false

jest.mock('@/hooks/useOpenSafenetStakingApp', () => ({
  useOpenSafenetStakingApp: () => ({
    openSafenetStakingApp: mockOpenSafenetStakingApp,
    isNavigating: mockIsNavigating,
  }),
}))

describe('SafenetStakeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsNavigating = false
  })

  it('renders an enabled button labelled for Safenet staking', () => {
    render(<SafenetStakeButton />)

    const button = screen.getByTestId('safenet-stake-btn')
    expect(button).toBeEnabled()
    expect(button).toHaveAccessibleName('Go to Safenet staking')
  })

  it('opens the Safenet staking app when clicked', async () => {
    render(<SafenetStakeButton />)

    await userEvent.click(screen.getByTestId('safenet-stake-btn'))

    expect(mockOpenSafenetStakingApp).toHaveBeenCalledTimes(1)
  })

  it('shows a spinner and blocks further clicks while navigating', async () => {
    mockIsNavigating = true
    render(<SafenetStakeButton />)

    const button = screen.getByTestId('safenet-stake-btn')
    expect(button).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()

    await userEvent.click(button)

    expect(mockOpenSafenetStakingApp).not.toHaveBeenCalled()
  })

  it('reveals the tooltip on hover', async () => {
    render(<SafenetStakeButton />)

    await userEvent.hover(screen.getByTestId('safenet-stake-btn'))

    await waitFor(() => {
      expect(screen.getByText('Go to Safenet staking')).toBeVisible()
    })
  })
})
