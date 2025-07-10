import { StatusBar } from 'expo-status-bar'
import { useSegments } from 'expo-router'
import { useTheme } from '@/src/theme/hooks/useTheme'

const DARK_SCREENS = [
  'onboarding',
  'enter-password',
  'file-selection',
  'help-import',
  'import-error',
  'import-progress',
  'import-success',
  'import-data',
  'review-data',
]

export const SafeStatusBar = () => {
  const { currentTheme } = useTheme()
  const segments = useSegments()
  const currentRoute = segments[segments.length - 1]

  const isDarkScreen = DARK_SCREENS.includes(currentRoute)

  if (isDarkScreen) {
    return <StatusBar style="light" />
  }

  return <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
}
