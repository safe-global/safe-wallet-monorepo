import { useRouter } from 'expo-router'
import { NetworksSheetContainer } from '@/src/features/NetworksSheet'
import { ScreenErrorBoundary } from '@/src/components/ErrorBoundary'

export const NetworksSheetScreen = () => {
  const router = useRouter()

  return (
    <ScreenErrorBoundary onDismiss={() => router.back()}>
      <NetworksSheetContainer />
    </ScreenErrorBoundary>
  )
}

export default NetworksSheetScreen
