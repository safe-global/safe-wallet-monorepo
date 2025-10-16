import React from 'react'
import { Toast, ToastProvider, ToastViewport, useToastState } from '@tamagui/toast'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

interface SafeThemeProviderProps {
  children: React.ReactNode
}

export const SafeToastProvider = ({ children }: SafeThemeProviderProps) => {
  const { top } = useSafeAreaInsets()

  return (
    <ToastProvider>
      {children}
      <CurrentToast />
      <ToastViewport multipleToasts={false} top={top + 60} left={0} right={0} />
    </ToastProvider>
  )
}

const CurrentToast = () => {
  const currentToast = useToastState()

  if (!currentToast || currentToast.isHandledNatively) {
    return null
  }

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="100ms"
      backgroundColor={currentToast.variant === 'error' ? '$backgroundError' : '$backgroundPaper'}
      viewportName={currentToast.viewportName}
    >
      <YStack style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Toast.Title>{currentToast.title}</Toast.Title>
        {!!currentToast.message && <Toast.Description>{currentToast.message}</Toast.Description>}
      </YStack>
    </Toast>
  )
}
