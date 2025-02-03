import { Stack } from 'expo-router'
import 'react-native-reanimated'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { persistor, store } from '@/src/store'
import { PersistGate } from 'redux-persist/integration/react'
import { isStorybookEnv } from '@/src/config/constants'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { HeaderBackButton } from '@react-navigation/elements'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@tamagui/portal'
import { NotificationsProvider } from '@/src/context/NotificationsContext'
import { SafeToastProvider } from '@/src/theme/provider/toastProvider'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { OnboardingHeader } from '@/src/features/Onboarding/components/OnboardingHeader'
import { install } from 'react-native-quick-crypto'

install()

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
                    <Stack
                      screenOptions={({ navigation }) => ({
                        headerBackButtonDisplayMode: 'minimal',
                        headerShadowVisible: false,
                        headerLeft: (props) => (
                          <HeaderBackButton
                            {...props}
                            tintColor="$color"
                            testID={'go-back'}
                            onPress={navigation.goBack}
                            displayMode={'minimal'}
                          />
                        ),
                      })}
                    >
                      <Stack.Screen
                        name="index"
                        options={{
                          header: OnboardingHeader,
                        }}
                      />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="pending-transactions" options={{ headerShown: true, title: '' }} />
                      <Stack.Screen name="notifications" options={{ headerShown: true, title: '' }} />

                      <Stack.Screen name="signers" options={{ headerShown: false }} />
                      <Stack.Screen name="import-signers" options={{ headerShown: false }} />

                      <Stack.Screen name="app-settings" options={{ headerShown: true, title: 'Settings' }} />
                      <Stack.Screen name="notifications-opt-in" options={{ headerShown: true, title: '' }} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
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
  AppEntryPoint = require('../.storybook').default
}

export default AppEntryPoint
