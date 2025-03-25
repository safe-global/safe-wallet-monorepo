import '../../shim'
import '@/src/config/polyfills'
import { Stack } from 'expo-router'
import 'react-native-reanimated'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { persistor, store } from '@/src/store'
import { PersistGate } from 'redux-persist/integration/react'
import { isStorybookEnv } from '@/src/config/constants'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@tamagui/portal'
import { NotificationsProvider } from '@/src/context/NotificationsContext'
import { SafeToastProvider } from '@/src/theme/provider/toastProvider'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { OnboardingHeader } from '@/src/features/Onboarding/components/OnboardingHeader'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { NavigationGuardHOC } from '@/src/navigation/NavigationGuardHOC'
import { StatusBar } from 'expo-status-bar'
import { TestCtrls } from '@/src/tests/e2e-maestro/components/TestCtrls'
import Logger, { LogLevel } from '@/src/utils/logger'

Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

function RootLayout() {
  store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())

  return (
    <GestureHandlerRootView>
      <Provider store={store}>
        <NotificationsProvider>
          <PortalProvider shouldAddRootHost>
            <BottomSheetModalProvider>
              <PersistGate loading={null} persistor={persistor}>
                <SafeThemeProvider>
                  <SafeToastProvider>
                    <NavigationGuardHOC>
                      <TestCtrls />
                      <Stack
                        screenOptions={({ navigation }) => ({
                          ...getDefaultScreenOptions(navigation.goBack),
                        })}
                      >
                        <Stack.Screen
                          name="onboarding"
                          options={{
                            header: OnboardingHeader,
                          }}
                        />
                        <Stack.Screen
                          name="get-started"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen
                          name="(import-accounts)"
                          options={{ headerShown: false, presentation: 'modal' }}
                        />
                        <Stack.Screen name="sign-transaction" options={{ headerShown: false }} />
                        <Stack.Screen name="pending-transactions" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="notifications-center" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="notifications-settings" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="transaction-parameters" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="transaction-actions" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="action-details" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="address-book" options={{ headerShown: true, title: '' }} />
                        <Stack.Screen name="signers" options={{ headerShown: false }} />
                        <Stack.Screen name="import-signers" options={{ headerShown: false }} />

                        <Stack.Screen name="app-settings" options={{ headerShown: true, title: 'Settings' }} />
                        <Stack.Screen
                          name="conflict-transaction-sheet"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="accounts-sheet"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="networks-sheet"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="confirmations-sheet"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="change-signer-sheet"
                          options={{
                            headerShown: false,
                            presentation: 'transparentModal',
                            animation: 'fade',
                          }}
                        />
                        <Stack.Screen
                          name="notifications-opt-in"
                          options={{
                            headerShown: false,
                            presentation: 'modal',
                            title: '',
                          }}
                        />
                        <Stack.Screen
                          name="biometrics-opt-in"
                          options={{
                            headerShown: false,
                            presentation: 'modal',
                            title: '',
                          }}
                        />
                        <Stack.Screen
                          name="confirm-transaction"
                          options={{
                            title: 'Confirm transaction',
                          }}
                        />
                        <Stack.Screen
                          name="share"
                          options={{
                            headerShown: false,
                            presentation: 'modal',
                          }}
                        />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <StatusBar />
                    </NavigationGuardHOC>
                  </SafeToastProvider>
                </SafeThemeProvider>
              </PersistGate>
            </BottomSheetModalProvider>
          </PortalProvider>
        </NotificationsProvider>
      </Provider>
    </GestureHandlerRootView>
  )
}

let AppEntryPoint = RootLayout

if (isStorybookEnv) {
  AppEntryPoint = require('../../.storybook').default
}

export default AppEntryPoint
