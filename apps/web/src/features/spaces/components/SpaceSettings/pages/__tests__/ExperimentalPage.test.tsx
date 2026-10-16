import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import ExperimentalPage from '../ExperimentalPage'

const mockUseIsAdmin = jest.fn()
const mockUseIsAllowlistAvailableInSpace = jest.fn()

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
}))

jest.mock('@/features/policy-guard', () => ({
  useIsAllowlistAvailableInSpace: () => mockUseIsAllowlistAvailableInSpace(),
}))

describe('ExperimentalPage', () => {
  beforeEach(() => {
    mockUseIsAllowlistAvailableInSpace.mockReturnValue(true)
  })

  it('lets an admin toggle the recipient allowlist', async () => {
    mockUseIsAdmin.mockReturnValue(true)
    render(<ExperimentalPage />)

    const toggle = screen.getByRole('switch', { name: 'Recipient allowlist' })
    expect(toggle).not.toBeChecked()

    await userEvent.click(toggle)

    expect(toggle).toBeChecked()
  })

  it('disables the toggle for non-admins', () => {
    mockUseIsAdmin.mockReturnValue(false)
    render(<ExperimentalPage />)

    expect(screen.getByRole('switch', { name: 'Recipient allowlist' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('hides the allowlist row when the allowlist is not available on any chain', () => {
    mockUseIsAdmin.mockReturnValue(true)
    mockUseIsAllowlistAvailableInSpace.mockReturnValue(false)
    render(<ExperimentalPage />)

    expect(screen.queryByRole('switch', { name: 'Recipient allowlist' })).not.toBeInTheDocument()
    expect(screen.getByTestId('experimental-empty')).toBeInTheDocument()
  })
})
