import { StatusBar } from 'expo-status-bar'
import { useTheme } from '@/src/theme/hooks/useTheme'

export const SafeStatusBar = () => {
  const { currentTheme } = useTheme()

  return <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
}
