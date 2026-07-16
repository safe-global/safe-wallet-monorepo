import { render, screen } from '@testing-library/react'
import LocalSafesAlert from '../LocalSafesAlert'

const mockUseAppSelector = jest.fn()
const mockUseChains = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}))

jest.mock('@/store/addedSafesSlice', () => ({
  selectAllAddedSafesOnSupportedChains: jest.fn(() => 'selectAllAddedSafesOnSupportedChains'),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
}))

describe('LocalSafesAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChains.mockReturnValue({ configs: [{ chainId: '1' }, { chainId: '100' }, { chainId: '137' }] })
  })

  it('renders nothing when no local Safes are present', () => {
    mockUseAppSelector.mockReturnValue({})
    const { container } = render(<LocalSafesAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the addedSafes slice is undefined (cold start)', () => {
    mockUseAppSelector.mockReturnValue({})
    const { container } = render(<LocalSafesAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders singular copy for exactly one Safe', () => {
    mockUseAppSelector.mockReturnValue({
      '1': { '0xAAA': { owners: [], threshold: 1 } },
    })
    render(<LocalSafesAlert />)
    expect(screen.getByTestId('local-safes-alert')).toBeInTheDocument()
    expect(screen.getByText('1 Safe detected on this browser')).toBeInTheDocument()
    expect(screen.getByText('Sign in to resume where you left off.')).toBeInTheDocument()
  })

  it('aggregates Safes across multiple chains and uses plural copy', () => {
    mockUseAppSelector.mockReturnValue({
      '1': {
        '0xAAA': { owners: [], threshold: 1 },
        '0xBBB': { owners: [], threshold: 1 },
      },
      '137': {
        '0xCCC': { owners: [], threshold: 1 },
        '0xDDD': { owners: [], threshold: 1 },
        '0xEEE': { owners: [], threshold: 1 },
      },
      '100': {
        '0xFFF': { owners: [], threshold: 1 },
        '0xGGG': { owners: [], threshold: 1 },
      },
    })
    render(<LocalSafesAlert />)
    expect(screen.getByText('7 Safes detected on this browser')).toBeInTheDocument()
  })
})
