import React from 'react'
import { render } from '@/src/tests/test-utils'
import { AppSettingsContainer } from '../AppSettings.container'

// MenuView is a native component; render its children and expose actions as Pressables.
jest.mock('@react-native-menu/menu', () => {
  const { Pressable, Text: RNText } = jest.requireActual('react-native')
  return {
    MenuView: ({
      children,
      actions,
      onPressAction,
    }: {
      children: React.ReactNode
      actions: { id: string; title: string }[]
      onPressAction: (event: { nativeEvent: { event: string } }) => void
    }) => (
      <>
        {children}
        {actions.map((action) => (
          <Pressable
            key={action.id}
            testID={`menu-action-${action.id}`}
            onPress={() => onPressAction({ nativeEvent: { event: action.id } })}
          >
            <RNText>{action.title}</RNText>
          </Pressable>
        ))}
      </>
    ),
  }
})

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

const mockGetBiometricsUIInfo = jest.fn(() => ({ label: 'Enable biometrics', icon: 'face-id' }))
jest.mock('@/src/hooks/useBiometrics', () => ({
  useBiometrics: () => ({
    toggleBiometrics: jest.fn(),
    promptBiometricsSetup: jest.fn(),
    isBiometricsEnabled: false,
    isLoading: false,
    getBiometricsUIInfo: mockGetBiometricsUIInfo,
  }),
}))

jest.mock('@/src/hooks/useNotificationManager', () => ({
  useNotificationManager: () => ({
    enableNotification: jest.fn(),
    disableNotification: jest.fn(),
    isLoading: false,
  }),
}))

describe('AppSettingsContainer', () => {
  it('renders the appearance menu with its testID so e2e theme selection stays anchored', () => {
    const { getByTestId } = render(<AppSettingsContainer />)

    expect(getByTestId('app-settings-appearance-button')).toBeTruthy()
  })
})
