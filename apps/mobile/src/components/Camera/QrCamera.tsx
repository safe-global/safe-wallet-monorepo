import { Camera, useCodeScanner, useCameraDevice, Code, CameraPermissionStatus } from 'react-native-vision-camera'
import { View, Theme, H3 } from 'tamagui'
import { Dimensions, Linking, Pressable, StyleSheet } from 'react-native'
import React, { useCallback } from 'react'
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

function CameraLens({ denied, onPress }: { denied: boolean; onPress: () => Promise<void> }) {
  return (
    <View style={[styles.transparentBox, denied && { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
      {/* Green corners */}
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.topLeft]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.topRight]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.bottomLeft]} />
      <View borderColor={denied ? '$error' : '$success'} style={[styles.corner, styles.bottomRight]} />

      {denied && (
        <View style={styles.deniedCameraContainer}>
          <SafeFontIcon name={'camera'} size={40} color={'$error'} />
          <SafeButton rounded secondary onPress={onPress} marginTop={20}>
            Enable camera
          </SafeButton>
        </View>
      )}
    </View>
  )
}

export const QrCamera = ({ heading = 'Scan a QR Code', footer, onScan, isCameraActive, permission }: QrCameraProps) => {
  const device = useCameraDevice('back')

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      onScan(codes)
    },
  })

  const openSettings = useCallback(async () => {
    await Linking.openSettings()
  }, [])

  const denied = permission === 'denied'

  return (
    <Theme name={'dark'}>
      <View style={styles.container}>
        {/* Camera View */}
        {device && (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={isCameraActive} codeScanner={codeScanner} />
        )}

        {/* Overlay with blurred edges */}
        <View style={styles.overlay}>
          <View flex={1}>
            <BlurView
              style={[styles.blurTop, denied && styles.deniedCameraBlur]}
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

              <CameraLens denied={denied} onPress={openSettings} />
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
    height: 250,
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
