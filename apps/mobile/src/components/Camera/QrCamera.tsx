import { Camera, useCodeScanner, useCameraDevice, Code, CameraPermissionStatus } from 'react-native-vision-camera'
import { View, Theme, H3, getTokenValue } from 'tamagui'
import { Dimensions, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { useTheme } from '@/src/theme/hooks/useTheme'
import React from 'react'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')
import { BlurView } from 'expo-blur'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { SafeButton } from '@/src/components/SafeButton'

type QrCameraProps = {
  heading?: React.ReactNode
  footer: React.ReactNode
  onScan: (code: Code[]) => void
  isCameraActive: boolean
  permission: CameraPermissionStatus
  onActivateCamera: () => void
  onRequestPermission: () => void | Promise<unknown>
  onPressSettings: () => void
  lensTone?: 'success' | 'neutral' | 'error'
  dimLens?: boolean
  centerOverlay?: React.ReactNode
}

const TONE_CORNER_COLOR: Record<NonNullable<QrCameraProps['lensTone']>, string> = {
  success: '$success',
  neutral: '$color',
  error: '$error',
}

type LensButtonConfig = {
  label: string
  onPress: () => void | Promise<unknown>
  testID?: string
}

// Returns the in-lens CTA for the current permission state, or null when the
// camera is live and no button should render. The 'denied' branch must NOT
// auto-redirect to Settings — it surfaces an explicit "Open Settings" button
// that the user has to tap (Apple guideline 5.1.1(iv)).
function getLensButtonConfig({
  permission,
  isCameraActive,
  onActivateCamera,
  onRequestPermission,
  onPressSettings,
}: {
  permission: CameraPermissionStatus
  isCameraActive: boolean
  onActivateCamera: () => void
  onRequestPermission: () => void | Promise<unknown>
  onPressSettings: () => void
}): LensButtonConfig | null {
  if (permission === 'granted') {
    if (isCameraActive) {
      return null
    }
    return { label: 'Continue', onPress: onActivateCamera, testID: 'camera-continue' }
  }

  if (permission === 'not-determined') {
    return { label: 'Continue', onPress: onRequestPermission, testID: 'camera-request-permission' }
  }

  // 'denied' or 'restricted'
  return { label: 'Open Settings', onPress: onPressSettings, testID: 'camera-open-settings' }
}

function CameraHeader({ heading }: { heading: React.ReactNode }) {
  const router = useRouter()

  return (
    <View style={styles.topContainer}>
      <View style={{ flex: 1, marginTop: 30, marginLeft: 20, flexDirection: 'row' }}>
        <Pressable
          onPress={() => {
            router.back()
          }}
          testID="close-camera"
        >
          <Badge themeName="badge_background" circleSize="$9" content={<SafeFontIcon size={20} name="close" />} />
        </Pressable>
      </View>

      <View flex={1} justifyContent={'flex-end'} alignItems={'center'} marginBottom={'$8'}>
        {typeof heading === 'string' ? <H3>{heading}</H3> : heading}
      </View>
    </View>
  )
}

function CameraFooter(props: { footer: React.ReactNode }) {
  return (
    <View style={styles.text} paddingVertical={'$8'}>
      {props.footer}
    </View>
  )
}

function CameraLens({
  permission,
  isCameraActive,
  onActivateCamera,
  onRequestPermission,
  onPressSettings,
  dim,
  cornerColor,
  centerOverlay,
}: {
  permission: CameraPermissionStatus
  isCameraActive: boolean
  onActivateCamera: () => void
  onRequestPermission: () => void | Promise<unknown>
  onPressSettings: () => void
  dim: boolean
  cornerColor: string
  centerOverlay?: React.ReactNode
}) {
  const { isDark } = useTheme()
  const color = isDark ? getTokenValue('$color.textPrimaryDark') : getTokenValue('$color.textPrimaryLight')

  const denied = permission === 'denied' || permission === 'restricted'
  const button = getLensButtonConfig({
    permission,
    isCameraActive,
    onActivateCamera,
    onRequestPermission,
    onPressSettings,
  })

  // Only allow the wrapper tap to activate the camera when no overlay owns the lens.
  const wrapperPress =
    permission === 'granted' && !isCameraActive && !centerOverlay
      ? () => {
          void onActivateCamera()
        }
      : undefined

  return (
    <Pressable
      style={[styles.transparentBox, dim && { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}
      onPress={wrapperPress}
      disabled={!wrapperPress}
      testID="camera-lens-wrapper"
    >
      <View borderColor={cornerColor} style={[styles.corner, styles.topLeft]} />
      <View borderColor={cornerColor} style={[styles.corner, styles.topRight]} />
      <View borderColor={cornerColor} style={[styles.corner, styles.bottomLeft]} />
      <View borderColor={cornerColor} style={[styles.corner, styles.bottomRight]} />

      {centerOverlay ? (
        <View style={styles.deniedCameraContainer}>{centerOverlay}</View>
      ) : (
        button && (
          <View style={styles.deniedCameraContainer}>
            <SafeFontIcon name={'camera'} size={40} color={denied ? '$error' : color} />
            <SafeButton rounded secondary onPress={button.onPress} marginTop={20} testID={button.testID}>
              {button.label}
            </SafeButton>
          </View>
        )
      )}
    </Pressable>
  )
}

export const QrCamera = ({
  heading = 'Scan a QR Code',
  footer,
  onScan,
  isCameraActive,
  permission,
  onActivateCamera,
  onRequestPermission,
  onPressSettings,
  lensTone = 'success',
  dimLens = false,
  centerOverlay,
}: QrCameraProps) => {
  const device = useCameraDevice('back')
  const { height } = useWindowDimensions()
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: onScan,
  })

  const denied = permission === 'denied' || permission === 'restricted'
  const granted = permission === 'granted'
  const dim = denied || dimLens
  const cornerColor = TONE_CORNER_COLOR[denied ? 'error' : lensTone]

  return (
    <Theme name={'dark'}>
      <View style={styles.container}>
        {device && granted && (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={isCameraActive} codeScanner={codeScanner} />
        )}

        <View style={styles.overlay}>
          <View flex={1}>
            <BlurView
              style={[styles.blurTop, dim && styles.deniedCameraBlur, { height: height * 0.3 }]}
              intensity={30}
              tint={'systemUltraThinMaterialDark'}
            >
              <CameraHeader heading={heading} />
            </BlurView>

            <View style={styles.transparentCenter}>
              <BlurView
                style={[styles.sideBlur, dim && styles.deniedCameraBlur]}
                intensity={30}
                tint={'systemUltraThinMaterialDark'}
              />

              <CameraLens
                permission={permission}
                isCameraActive={isCameraActive}
                onActivateCamera={onActivateCamera}
                onRequestPermission={onRequestPermission}
                onPressSettings={onPressSettings}
                dim={dim}
                cornerColor={cornerColor}
                centerOverlay={centerOverlay}
              />
              <BlurView
                style={[styles.sideBlur, dim && styles.deniedCameraBlur]}
                intensity={30}
                tint={'systemUltraThinMaterialDark'}
              />
            </View>

            <BlurView
              style={[styles.blur, dim && styles.deniedCameraBlur]}
              intensity={30}
              tint={'systemUltraThinMaterialDark'}
            >
              <CameraFooter footer={footer} />
            </BlurView>
          </View>
        </View>
      </View>
    </Theme>
  )
}

const BOX_RADIUS = 5
const CORNER_SIZE = 30

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurTop: {
    flex: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  topContainer: {
    flex: 1,
  },
  transparentCenter: {
    flexDirection: 'row',
  },
  sideBlur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  transparentBox: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: BOX_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: BOX_RADIUS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: BOX_RADIUS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: BOX_RADIUS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: BOX_RADIUS,
  },
  text: {
    marginTop: 20,
    maxWidth: width * 0.8,
    alignSelf: 'center',
  },
  deniedCameraBlur: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  deniedCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
