import React from 'react'

import '@testing-library/react-native/extend-expect'
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

import { server } from './server'

jest.useFakeTimers()

/**
 *  This mock is necessary because useFonts is async and we get an error
 *  Warning: An update to FontProvider inside a test was not wrapped in act(...)
 */
jest.mock('expo-font', () => ({
  useFonts: () => [true],
  isLoaded: () => true,
}))

jest.mock('react-native-mmkv', () => ({
  MMKV: function () {
    // @ts-ignore
    this.getString = jest.fn()
    // @ts-ignore
    this.delete = jest.fn()
    // @ts-ignore
    this.set = jest.fn()
  },
}))

jest.mock('react-native-device-info', () => mockRNDeviceInfo)
jest.mock('react-native-device-crypto', () => {
  return {
    getOrCreateAsymmetricKey: jest.fn(),
    encrypt: jest.fn((_asymmetricKey: string, privateKey: string) => {
      return Promise.resolve({
        encryptedText: 'encryptedText',
        iv: privateKey + '000',
      })
    }),
    decrypt: jest.fn((_name, _password, iv) => Promise.resolve(iv.slice(0, -3))),
  }
})

jest.mock('react-native-keychain', () => {
  let password: string | null = null
  return {
    setGenericPassword: jest.fn((_user, newPassword: string) => {
      password = newPassword

      return Promise.resolve(password)
    }),
    getGenericPassword: jest.fn(() =>
      Promise.resolve({
        password,
      }),
    ),
    resetGenericPassword: jest.fn(() => {
      password = null
      Promise.resolve(null)
    }),
  }
})

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  setOptions: jest.fn(),
  hideAsync: jest.fn(),
}))

jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist')
  return {
    ...real,
    persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
  }
})
jest.mock('redux-devtools-expo-dev-plugin', () => ({
  default: () => jest.fn(),
}))
jest.mock('@gorhom/bottom-sheet', () => {
  const reactNative = jest.requireActual('react-native')
  const { useState, forwardRef, useImperativeHandle } = jest.requireActual('react')
  const { View } = reactNative
  const MockBottomSheetComponent = forwardRef(
    (
      {
        children,
        backdropComponent: Backdrop,
        backgroundComponent: Background,
      }: { backgroundComponent: React.FC<unknown>; backdropComponent: React.FC<unknown>; children: React.ReactNode },
      ref: React.ForwardedRef<unknown>,
    ) => {
      const [isOpened, setIsOpened] = useState()

      // Exposing some imperative methods to the parent.
      useImperativeHandle(ref, () => ({
        // Add methods here that can be accessed using the ref from parent
        present: () => {
          setIsOpened(true)
        },
        dismiss: () => {
          setIsOpened(false)
        },
      }))

      return isOpened ? (
        <>
          <Backdrop /> <Background />
          {children}
        </>
      ) : null
    },
  )

  MockBottomSheetComponent.displayName = 'MockBottomSheetComponent'

  return {
    __esModule: true,
    default: View,
    BottomSheetFooter: View,
    BottomSheetFooterContainer: View,
    BottomSheetModal: MockBottomSheetComponent,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
    useBottomSheetModal: () => ({
      dismiss: () => {
        return null
      },
    }),
  }
})

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
}))

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
