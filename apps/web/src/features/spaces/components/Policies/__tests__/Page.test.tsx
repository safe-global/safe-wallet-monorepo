import { fireEvent, render, screen } from '@/tests/test-utils'
import { mockPolicies } from '../mocks/policies'
import SpacePoliciesPage from '../Page'

const mockUseSpacePolicies = jest.fn()

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

describe('SpacePoliciesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacePolicies.mockReturnValue(settled)
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
})
