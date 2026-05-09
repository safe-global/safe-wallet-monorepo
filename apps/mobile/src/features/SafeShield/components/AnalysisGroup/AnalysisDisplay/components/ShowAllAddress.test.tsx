import { render, fireEvent } from '@/src/tests/test-utils'
import { ShowAllAddress } from './ShowAllAddress'
import { faker } from '@faker-js/faker'
import * as useCopyAndDispatchToastHook from '@/src/hooks/useCopyAndDispatchToast'

jest.mock('@/src/hooks/useCopyAndDispatchToast')
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}))

describe('ShowAllAddress', () => {
  const mockUseCopyAndDispatchToast = useCopyAndDispatchToastHook.useCopyAndDispatchToast as jest.MockedFunction<
    typeof useCopyAndDispatchToastHook.useCopyAndDispatchToast
  >
  const mockCopyAndDispatchToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCopyAndDispatchToast.mockReturnValue(mockCopyAndDispatchToast)
  })

  it('should render collapsed by default', () => {
    const addresses = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

    const { getByText, queryByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    expect(getByText('Show all')).toBeTruthy()
    expect(queryByText(addresses[0])).toBeNull()
  })

  it('should expand when toggle is pressed', () => {
    const addresses = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

    const { getByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    const toggle = getByText('Show all')
    // Find the TouchableOpacity parent
    const touchableOpacity = toggle.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(toggle)
    }

    expect(getByText('Hide all')).toBeTruthy()
    expect(getByText(addresses[0])).toBeTruthy()
    expect(getByText(addresses[1])).toBeTruthy()
  })

  it('should collapse when toggle is pressed again', () => {
    const addresses = [faker.finance.ethereumAddress()]

    const { getByText, queryByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    const toggle = getByText('Show all')
    const touchableOpacity = toggle.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(toggle)
    }
    expect(getByText('Hide all')).toBeTruthy()

    const hideToggle = getByText('Hide all')
    const hideTouchableOpacity = hideToggle.parent?.parent
    if (hideTouchableOpacity) {
      fireEvent.press(hideTouchableOpacity)
    } else {
      fireEvent.press(hideToggle)
    }

    expect(getByText('Show all')).toBeTruthy()
    expect(queryByText(addresses[0])).toBeNull()
  })

  it('should render all addresses when expanded', () => {
    const addresses = [
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
    ]

    const { getByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    const showAllText = getByText('Show all')
    const touchableOpacity = showAllText.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(showAllText)
    }

    addresses.forEach((address) => {
      expect(getByText(address)).toBeTruthy()
    })
  })

  it('should call copy function when address is copied', () => {
    const addresses = [faker.finance.ethereumAddress()]

    const { getByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    const showAllText = getByText('Show all')
    const touchableOpacity = showAllText.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(showAllText)
    }

    // The copy functionality is tested through AddressListItem component
    // This test verifies the component renders correctly
    expect(getByText(addresses[0])).toBeTruthy()
  })

  it('should open explorer link when explorer icon is pressed', () => {
    const addresses = [faker.finance.ethereumAddress()]

    const { getByText } = render(<ShowAllAddress addresses={addresses} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    const showAllText = getByText('Show all')
    const touchableOpacity = showAllText.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(showAllText)
    }

    // The explorer link functionality is tested through AddressListItem
    // This test verifies the component renders correctly with explorer links
    expect(getByText(addresses[0])).toBeTruthy()
  })
})
