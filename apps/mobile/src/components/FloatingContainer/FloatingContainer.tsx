import { Layout } from '@/src/store/constants'
import React, { FC, useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform, StyleSheet, View } from 'react-native'

interface FloatingContainerProps {
  children: React.ReactNode
  noOffset?: boolean
  sticky?: boolean
  keyboardAvoidEnabled?: boolean
  onLayout?: KeyboardAvoidingViewProps['onLayout']
  testID?: string
}

export const FloatingContainer: FC<FloatingContainerProps> = ({
  children,
  noOffset,
  sticky,
  keyboardAvoidEnabled,
  onLayout,
  testID,
}: FloatingContainerProps) => {
  const bottomInset = useSafeAreaInsets().bottom
  const deviceBottom = Layout.isSmallDevice ? 10 : 20

  const bottomPadding = useMemo(() => {
    return Math.max(bottomInset, deviceBottom)
  }, [bottomInset])

  const keyboardVerticalOffset = useMemo(() => {
    return noOffset ? 0 : Platform.select({ ios: 40, default: 0 })
  }, [noOffset])

  return (
    <KeyboardAvoidingView
      testID={testID}
      behavior={sticky ? 'height' : 'position'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={keyboardAvoidEnabled}
      style={[styles.floatingContainer, { paddingBottom: bottomPadding }]}
      onLayout={onLayout}
    >
      <View style={styles.childContainer}>{children}</View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'fixed',
    bottom: -40,
    width: '100%',
    zIndex: 1,
  },
  childContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
})
