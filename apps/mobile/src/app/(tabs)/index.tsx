import React from 'react'
import { AssetsContainer } from '@/src/features/Assets'
import { ScreenErrorBoundary } from '@/src/components/ErrorBoundary'

const HomeScreen = () => {
  return (
    <ScreenErrorBoundary>
      <AssetsContainer />
    </ScreenErrorBoundary>
  )
}

export default HomeScreen
