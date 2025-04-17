import { Camera, useCodeScanner, useCameraDevice, Code, CameraPermissionStatus } from 'react-native-vision-camera'
import { View, Theme, H3, getTokenValue } from 'tamagui'
import { Dimensions, Linking, Pressable, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native'
import React, { useCallback, useEffect } from 'react'
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
  requestPermission: () => void
  hasPermission: boolean
  onActivateCamera: () => void
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
  denied,
  onPressSettings,
  hasPermission,
  onActivateCamera,
  isCameraActive,
}: {
  denied: boolean
  onPressSettings: () => Promise<void>
  hasPermission: boolean
  onActivateCamera: () => void
  isCameraActive: boolean
}) {
  const colorScheme = useColorScheme()

  let color = getTokenValue('$color.textPrimaryDark')

  if (colorScheme === 'light') {
    color = getTokenValue('$color.textPrimaryLight')
  }

  const handleGrantOrActivatePress = useCallback(async () => {
    if (!hasPermission) {
      const permission = await Camera.requestCameraPermission()

      if (permission === 'denied') {
        await onPressSettings()
      }
    } else if (hasPermission && !isCameraActive) {
      onActivateCamera()
    }
  }, [hasPermission, isCameraActive, onActivateCamera, onPressSettings])

  const buttonText = 'Enable camera'
  const buttonAction = handleGrantOrActivatePress

  return (
    <Pressable
      style={[styles.transparentBox, denied && { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}
      onPress={hasPermission && !isCameraActive ? handleGrantOrActivatePress : undefined}
      disabled={denied || !hasPermission}
    >
      {/* Green corners */}
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.topLeft]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.topRight]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.bottomLeft]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.bottomRight]} />

      {/* Show button/icon only if permission denied, not granted, or granted but inactive */}
      {(denied || !hasPermission || (hasPermission && !isCameraActive)) && (
        <View style={styles.deniedCameraContainer}>
          <SafeFontIcon name={'camera'} size={40} color={denied ? '$error' : color} />
          <SafeButton rounded secondary onPress={buttonAction} marginTop={20}>
            {buttonText}
          </SafeButton>
        </View>
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
  hasPermission,
  onActivateCamera,
}: QrCameraProps) => {
  const device = useCameraDevice('back')
  const { height } = useWindowDimensions()
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      onScan(codes)
    },
  })

  const openSettings = useCallback(async () => {
    await Linking.openSettings()
  }, [])

  // Effect to automatically activate camera once permission is granted
  useEffect(() => {
    if (permission === 'granted' && hasPermission && !isCameraActive) {
      onActivateCamera()
    }
  }, [permission, hasPermission, isCameraActive, onActivateCamera])

  const denied = permission === 'denied'

  return (
    <Theme name={'dark'}>
      <View style={styles.container}>
        {/* Only render Camera when active and device is available */}
        {isCameraActive && device && (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={isCameraActive} codeScanner={codeScanner} />
        )}

        {/* Overlay with blurred edges */}
        <View style={styles.overlay}>
          <View flex={1}>
            <BlurView
              style={[styles.blurTop, denied && styles.deniedCameraBlur, { height: height * 0.3 }]}
              intensity={30}
              tint={'systemUltraThinMaterialDark'}
            >
              <CameraHeader heading={heading} />
            </BlurView>

            {/* Middle with transparent center */}
            <View style={styles.transparentCenter}>
              <BlurView
                style={[styles.sideBlur, denied && styles.deniedCameraBlur]}
                intensity={30}
                tint={'systemUltraThinMaterialDark'}
              />

              <CameraLens
                denied={denied}
                onPressSettings={openSettings}
                hasPermission={hasPermission}
                onActivateCamera={onActivateCamera}
                isCameraActive={isCameraActive}
              />
              <BlurView
                style={[styles.sideBlur, denied && styles.deniedCameraBlur]}
                intensity={30}
                tint={'systemUltraThinMaterialDark'}
              />
            </View>

            {/* Bottom Blur */}
            <BlurView
              style={[styles.blur, denied && styles.deniedCameraBlur]}
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

const BOX_RADIUS = 5 // Rounded corners
const CORNER_SIZE = 30 // Size of the green corners

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Simulates blur
  },
  blurTop: {
    flex: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Simulates blur
  },
  topContainer: {
    flex: 1,
  },
  transparentCenter: {
    flexDirection: 'row',
  },
  sideBlur: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Simulates blur
  },
  transparentBox: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: BOX_RADIUS, // Rounded corners
    overflow: 'hidden', // Prevents content leaking outside the corners
    position: 'relative', // For positioning corners
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#00FF00',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: BOX_RADIUS, // Matches the box's radius
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
