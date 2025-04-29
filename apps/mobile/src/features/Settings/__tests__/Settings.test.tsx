import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Settings } from '../Settings'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { RootState } from '@/src/store'
import { NavigationContainer } from '@react-navigation/native'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
  useSegments: () => ['test'],
}))

const mockSafeState: SafeState = {
  address: { value: '0x123' },
  chainId: '1',
  nonce: 0,
  threshold: 2,
  owners: [{ value: '0x123' }, { value: '0x456' }],
  implementation: { value: '0x789', name: 'Safe v1.3.0' },
  implementationVersionState: 'UP_TO_DATE',
  modules: null,
  fallbackHandler: null,
  guard: null,
  version: '1.3.0',
  collectiblesTag: null,
  txQueuedTag: null,
  txHistoryTag: null,
  messagesTag: null,
}

const mockProps = {
  address: '0x123' as `0x${string}`,
  data: mockSafeState,
  displayDevMenu: false,
  onImplementationTap: jest.fn(),
  contact: null,
  isLatestVersion: false,
  latestSafeVersion: '1.4.0',
}

const initialStore: Partial<RootState> = {
  activeSafe: {
    address: '0x123',
    chainId: '1',
  },
}

// Custom wrapper with NavigationContainer
const wrapper = ({ children }: { children: React.ReactNode }) => <NavigationContainer>{children}</NavigationContainer>

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Version Display', () => {
    it('should display the implementation name and latest version when not on latest version', () => {
      const { getByText } = render(<Settings {...mockProps} />, {
        initialStore,
        wrapper,
      })

      const versionText = getByText('Safe v1.3.0 (Latest version: 1.4.0)')
      expect(versionText).toBeTruthy()
    })

    it('should display the implementation name with "Latest version" text when on latest version', () => {
      const { getByText } = render(<Settings {...mockProps} isLatestVersion={true} />, {
        initialStore,
        wrapper,
      })

      const versionText = getByText('Safe v1.3.0 (Latest version)')
      expect(versionText).toBeTruthy()
    })

    it('should show check icon when on latest version', () => {
      const { getByTestId } = render(<Settings {...mockProps} isLatestVersion={true} />, {
        initialStore,
        wrapper,
      })

      const checkIcon = getByTestId('check-icon')
      expect(checkIcon).toBeTruthy()
    })

    it('should not show check icon when not on latest version', () => {
      const { queryByTestId } = render(<Settings {...mockProps} isLatestVersion={false} />, {
        initialStore,
        wrapper,
      })

      const checkIcon = queryByTestId('check-icon')
      expect(checkIcon).toBeNull()
    })
  })
})
