import type { Preview } from '@storybook/react'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { StorybookThemeProvider } from '@/src/theme/provider/storybookTheme'
import { SafeToastProvider } from '@/src/theme/provider/toastProvider'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PortalProvider, View } from 'tamagui'
import { createNavigationContainerRef } from '@react-navigation/native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from '@/src/store'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { web3API } from '@/src/store/signersBalance'
import { TOKEN_LISTS } from '@/src/store/settingsSlice'
import { chainsAdapter } from '@safe-global/store/gateway/chains'
import { mockChain } from '@/src/tests/mocks'

const navigationRef = createNavigationContainerRef()

// Create a mock Redux store for Storybook
const createStorybookStore = () => {
  const mockChainsState = chainsAdapter.setAll(chainsAdapter.getInitialState(), [mockChain])

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(cgwClient.middleware, web3API.middleware),
    preloadedState: {
      settings: {
        onboardingVersionSeen: '',
        themePreference: 'light',
        currency: 'usd',
        tokenList: TOKEN_LISTS.TRUSTED,
        env: {
          rpc: {},
          tenderly: {
            url: '',
            accessToken: '',
          },
        },
      },
      activeSafe: {
        chainId: '1',
        address: '0x1234567890123456789012345678901234567890',
        threshold: 1,
        owners: [],
        nonce: 0,
        version: '1.3.0',
      },
      [cgwClient.reducerPath]: {
        queries: {
          'getChainsConfig(undefined)': {
            status: 'fulfilled',
            data: mockChainsState,
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })
}

const storybookStore = createStorybookStore()

// Navigation wrapper component for Storybook
// Uses NavigationIndependentTree to isolate from any parent navigation
const NavigationWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer
        ref={navigationRef}
        documentTitle={{
          enabled: false,
        }}
      >
        {children}
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light'

      return (
        <Provider store={storybookStore}>
          <PortalProvider shouldAddRootHost>
            <NavigationWrapper>
              <SafeAreaProvider>
                <StorybookThemeProvider theme={theme}>
                  <SafeToastProvider>
                    <View style={{ padding: 16, flex: 1 }} backgroundColor={'$background'}>
                      <Story />
                    </View>
                  </SafeToastProvider>
                </StorybookThemeProvider>
              </SafeAreaProvider>
            </NavigationWrapper>
          </PortalProvider>
        </Provider>
      )
    },
  ],
}

export default preview
