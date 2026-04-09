/**
 * Drop-in replacement for @reown/appkit-ui-react-native's wui-modal component.
 *
 * On iOS, uses FullWindowOverlay from react-native-screens to render above
 * react-native-screens transparent modal presentations, which block RN Modal's
 * presentViewController. On Android, falls back to RN Modal.
 *
 * This file is loaded via Metro resolver alias in metro.config.js.
 */
import { useEffect, useRef, useState } from 'react'
import {
  useWindowDimensions,
  Modal as RNModal,
  type ModalProps as RNModalProps,
  Animated,
  Pressable,
  View,
  StyleSheet,
  Platform,
} from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'

// Public re-exports — same module instances as the rest of AppKit
import { useTheme, BorderRadius } from '@reown/appkit-ui-react-native'

export type ModalProps = Pick<RNModalProps, 'visible' | 'onDismiss' | 'testID' | 'onRequestClose'> & {
  children: React.ReactNode
  onBackdropPress?: () => void
}

const styles = StyleSheet.create({
  backdrop: {
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderTopLeftRadius: BorderRadius.l,
    borderTopRightRadius: BorderRadius.l,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomBackground: {
    flexGrow: 1,
    top: -2,
    bottom: -20,
  },
})

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Modal({ visible, onBackdropPress, onRequestClose, testID, children }: ModalProps) {
  const { height } = useWindowDimensions()
  const Theme = useTheme()
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(height)).current
  const [showBackdrop, setShowBackdrop] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)

  const onContentLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    const measuredHeight = event.nativeEvent.layout.height
    setContentHeight(measuredHeight > height ? height : measuredHeight)
  }

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      setShowBackdrop(true)
    }
  }, [visible])

  useEffect(() => {
    let anim: Animated.CompositeAnimation

    if (visible) {
      anim = Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
      anim.start()
    } else if (modalVisible) {
      anim = Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
      anim.start(() => setShowBackdrop(false))
    }

    return () => anim?.stop()
  }, [visible, modalVisible, backdropOpacity])

  useEffect(() => {
    let anim: Animated.CompositeAnimation

    if (visible && modalVisible) {
      const targetY = contentHeight > 0 ? height - contentHeight : height * 0.2
      anim = Animated.spring(translateY, {
        toValue: targetY,
        damping: 25,
        stiffness: 220,
        mass: 1,
        useNativeDriver: true,
      })
      anim.start()
    } else if (!visible && modalVisible) {
      anim = Animated.timing(translateY, {
        toValue: height,
        duration: 150,
        useNativeDriver: true,
      })
      anim.start(() => setModalVisible(false))
    }

    return () => anim?.stop()
  }, [visible, modalVisible, translateY, height, contentHeight])

  useEffect(() => {
    if (!modalVisible) {
      translateY.setValue(height)
      backdropOpacity.setValue(0)
    }
  }, [modalVisible, translateY, backdropOpacity, height])

  const modalContent = (
    <>
      {showBackdrop ? (
        <AnimatedPressable style={[styles.backdrop, { opacity: backdropOpacity }]} onPress={onBackdropPress} />
      ) : null}
      <Animated.View style={[styles.modal, { transform: [{ translateY }] }]}>
        <Animated.View onLayout={onContentLayout}>{children}</Animated.View>
        <View style={[styles.bottomBackground, { backgroundColor: Theme['bg-100'] }]} />
      </Animated.View>
    </>
  )

  if (Platform.OS === 'ios') {
    if (!modalVisible) {
      return null
    }

    return (
      <FullWindowOverlay>
        <View style={{ flex: 1 }} testID={testID} pointerEvents="box-none">
          {modalContent}
        </View>
      </FullWindowOverlay>
    )
  }

  return (
    <RNModal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose}
      testID={testID}
    >
      {modalContent}
    </RNModal>
  )
}
