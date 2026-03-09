import { render } from '@testing-library/react'
import SpaceSafeBar from './index'

const mockItems = [
  {
    id: '1:0xSafe1',
    name: 'My Safe',
    address: '0xSafe1',
    threshold: 2,
    owners: 3,
    balance: '1000',
    chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
  },
]

jest.mock('@/features/spaces', () => ({
  useIsQualifiedSafe: jest.fn(),
}))

jest.mock('./hooks/useSpaceSafeSelectorItems', () => ({
  useSpaceSafeSelectorItems: jest.fn(),
}))

jest.mock('@/features/spaces/components/SafeSelectorDropdown', () => {
  const MockSafeSelectorDropdown = (props: Record<string, unknown>) => (
    <div
      data-testid="safe-selector-dropdown"
      data-items={JSON.stringify(props.items)}
      data-error={String(props.isError)}
      data-selected-item-id={props.selectedItemId as string}
      data-has-on-item-select={String(typeof props.onItemSelect === 'function')}
      data-has-on-chain-change={String(typeof props.onChainChange === 'function')}
      data-has-on-retry={String(typeof props.onRetry === 'function')}
    />
  )
  MockSafeSelectorDropdown.displayName = 'SafeSelectorDropdown'
  return { __esModule: true, default: MockSafeSelectorDropdown }
})

import { useIsQualifiedSafe } from '@/features/spaces'
import { useSpaceSafeSelectorItems } from './hooks/useSpaceSafeSelectorItems'

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock
const mockUseSpaceSafeSelectorItems = useSpaceSafeSelectorItems as jest.Mock

describe('SpaceSafeBar', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      items: mockItems,
      selectedItemId: '1:0xSafe1',
      handleItemSelect: jest.fn(),
      handleChainChange: jest.fn(),
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('renders nothing when the user has no space (useIsQualifiedSafe returns false)', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    const { container } = render(<SpaceSafeBar />)
    expect(container.innerHTML).toBe('')
  })

  it('renders SafeSelectorDropdown when useIsQualifiedSafe returns true', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown')).toBeInTheDocument()
  })

  it('passes items from the hook to SafeSelectorDropdown', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    const { getByTestId } = render(<SpaceSafeBar />)
    const dropdown = getByTestId('safe-selector-dropdown')
    expect(JSON.parse(dropdown.getAttribute('data-items')!)).toEqual(mockItems)
  })

  it('passes isError=true to SafeSelectorDropdown when the overview query fails', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      items: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      handleChainChange: jest.fn(),
      isError: true,
      refetch: jest.fn(),
    })

    const { getByTestId } = render(<SpaceSafeBar />)
    expect(getByTestId('safe-selector-dropdown').getAttribute('data-error')).toBe('true')
  })

  it('passes selectedItemId, onItemSelect, onChainChange, and onRetry to SafeSelectorDropdown', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    const { getByTestId } = render(<SpaceSafeBar />)
    const dropdown = getByTestId('safe-selector-dropdown')

    expect(dropdown.getAttribute('data-selected-item-id')).toBe('1:0xSafe1')
    expect(dropdown.getAttribute('data-has-on-item-select')).toBe('true')
    expect(dropdown.getAttribute('data-has-on-chain-change')).toBe('true')
    expect(dropdown.getAttribute('data-has-on-retry')).toBe('true')
  })

  it('renders nothing when there are no safes but isQualifiedSafe is false', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)
    mockUseSpaceSafeSelectorItems.mockReturnValue({
      items: [],
      selectedItemId: '',
      handleItemSelect: jest.fn(),
      handleChainChange: jest.fn(),
      isError: false,
      refetch: jest.fn(),
    })

    const { container } = render(<SpaceSafeBar />)
    expect(container.innerHTML).toBe('')
  })
})
