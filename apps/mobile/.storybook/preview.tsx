import type { Preview } from '@storybook/react'
import { NavigationIndependentTree } from '@react-navigation/native'
import { StorybookThemeProvider } from '@/src/theme/provider/storybookTheme'
import { SafeToastProvider } from '@/src/theme/provider/toastProvider'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PortalProvider, View } from 'tamagui'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <PortalProvider shouldAddRootHost>
          <NavigationIndependentTree>
            <SafeAreaProvider>
              <StorybookThemeProvider>
                <SafeToastProvider>
                  <View style={{ padding: 16, flex: 1 }} backgroundColor={'$background'}>
                    <Story />
                  </View>
                </SafeToastProvider>
              </StorybookThemeProvider>
            </SafeAreaProvider>
          </NavigationIndependentTree>
        </PortalProvider>
      )
    },
  ],
}

export default preview
