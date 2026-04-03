import React, { createContext, useContext, useEffect } from 'react'
import type { DimensionValue, LayoutChangeEvent } from 'react-native'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@/src/theme/hooks/useTheme'

const SHIMMER_COLORS = {
  light: ['#ececec', '#dcdcdc', '#ececec'] as const,
  dark: ['#1a1a1a', '#333333', '#1a1a1a'] as const,
}

const BG_COLORS = { light: '#ececec', dark: '#1a1a1a' } as const

const DEFAULT_SIZE = 32
const ANIMATION_DURATION = 1500

// --- Group context ---

const SkeletonGroupContext = createContext<boolean | undefined>(undefined)

function SafeSkeletonGroup({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <SkeletonGroupContext.Provider value={show}>{children}</SkeletonGroupContext.Provider>
}

// --- Shimmer overlay ---

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

function ShimmerOverlay({ measuredWidth, colorMode }: { measuredWidth: number; colorMode: 'light' | 'dark' }) {
  const translateX = useSharedValue(-measuredWidth)

  useEffect(() => {
    translateX.value = -measuredWidth
    translateX.value = withRepeat(
      withTiming(measuredWidth, {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
    )
    return () => cancelAnimation(translateX)
  }, [measuredWidth, translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <AnimatedLinearGradient
      colors={[...SHIMMER_COLORS[colorMode]]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[
        {
          ...StyleSheet.absoluteFillObject,
          width: measuredWidth * 2,
        },
        animatedStyle,
      ]}
    />
  )
}

// --- SafeSkeleton ---

interface SafeSkeletonProps {
  height?: number
  width?: number | DimensionValue
  radius?: number | 'round'
  show?: boolean
  children?: React.ReactNode
}

export function SafeSkeleton({ height, width, radius = 8, show: showProp, children }: SafeSkeletonProps) {
  const groupShow = useContext(SkeletonGroupContext)
  const show = showProp ?? groupShow ?? !children
  const { colorScheme } = useTheme()
  const colorMode = colorScheme === 'dark' ? 'dark' : 'light'

  const [measuredWidth, setMeasuredWidth] = React.useState(0)

  const borderRadius = radius === 'round' ? 99999 : radius

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && w !== measuredWidth) {
      setMeasuredWidth(w)
    }
  }

  const effectiveHeight = height ?? (children ? undefined : DEFAULT_SIZE)
  const effectiveWidth = width ?? (children ? undefined : DEFAULT_SIZE)

  return (
    <View
      style={{
        minHeight: effectiveHeight,
        minWidth: effectiveWidth,
      }}
    >
      {children && <View style={{ opacity: show ? 0 : 1 }}>{children}</View>}

      {show && (
        <View
          onLayout={onLayout}
          style={{
            position: children ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: effectiveWidth ?? '100%',
            height: effectiveHeight ?? '100%',
            borderRadius,
            overflow: 'hidden',
            backgroundColor: BG_COLORS[colorMode],
          }}
          pointerEvents="none"
        >
          {measuredWidth > 0 && <ShimmerOverlay measuredWidth={measuredWidth} colorMode={colorMode} />}
        </View>
      )}
    </View>
  )
}

SafeSkeleton.Group = SafeSkeletonGroup
