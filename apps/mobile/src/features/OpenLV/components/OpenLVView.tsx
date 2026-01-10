import React, { useState, useCallback } from 'react'
import { YStack, Text, XStack, View } from 'tamagui'
import { Pressable } from 'react-native'
import { SafeInfo } from '@/src/types/address'
import { Identicon } from '@/src/components/Identicon'
import { OpenLVProvider } from '@openlv/react-native/provider'
import { useWalletSession } from '../hooks/useWalletSession'
import { SafeInput } from '@/src/components/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'
import { QrCamera } from '@/src/components/Camera'
import { Camera, useCameraPermission, Code } from 'react-native-vision-camera'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { toUtf8String } from 'ethers'
import { OpenLVLogo } from '@/src/components/SVGs/OpenLVLogo'

type OpenLVViewProps = {
  activeSafe: SafeInfo
}

export const OpenLVView = ({ activeSafe }: OpenLVViewProps) => {
  const {
    connectionUrl,
    setConnectionUrl,
    status,
    session,
    startSession,
    closeSession,
    pendingRequest,
    confirmRequest,
    rejectRequest,
  } = useWalletSession(activeSafe.address)

  const [showQrScanner, setShowQrScanner] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const permission = Camera.getCameraPermissionStatus()
  const { hasPermission } = useCameraPermission()

  const handleQrScan = useCallback(
    (codes: Code[]) => {
      if (codes.length > 0) {
        const scannedUrl = codes[0].value || ''
        setConnectionUrl(scannedUrl)
        setShowQrScanner(false)
        setIsCameraActive(false)
      }
    },
    [setConnectionUrl],
  )

  const handleActivateCamera = useCallback(() => {
    setIsCameraActive(true)
  }, [])

  const toggleQrScanner = useCallback(() => {
    setShowQrScanner(!showQrScanner)
    if (!showQrScanner) {
      setIsCameraActive(true)
    } else {
      setIsCameraActive(false)
    }
  }, [showQrScanner])

  const isLinked = status === 'linked' || status === 'connected'

  if (pendingRequest) {
    let displayMessage = pendingRequest.message
    try {
      if (displayMessage.startsWith('0x')) {
        displayMessage = toUtf8String(displayMessage)
      }
    } catch {
      // Ignore conversion errors, use original message
    }

    return (
      <YStack flex={1} padding="$5" gap="$5" justifyContent="center">
        <YStack alignItems="center" gap="$2">
          <SafeFontIcon name="edit" size={48} color="$primary" />
          <Text fontSize="$7" textAlign="center" fontWeight="bold">
            Sign Message
          </Text>
        </YStack>

        <YStack gap="$2">
          <Text fontSize="$3" color="$colorLight" textAlign="left">
            The connected application is requesting a signature:
          </Text>
          <YStack
            backgroundColor="$backgroundSecondary"
            padding="$4"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$borderLight"
          >
            <Text fontFamily="$mono" fontSize="$2" color="$color">
              {displayMessage}
            </Text>
          </YStack>
        </YStack>

        <YStack gap="$3" marginTop="$4">
          <SafeButton onPress={confirmRequest}>Sign Message</SafeButton>
          <SafeButton secondary onPress={rejectRequest}>
            Reject
          </SafeButton>
        </YStack>
      </YStack>
    )
  }

  if (showQrScanner) {
    return (
      <QrCamera
        permission={permission}
        hasPermission={hasPermission}
        isCameraActive={isCameraActive}
        onScan={handleQrScan}
        onActivateCamera={handleActivateCamera}
        heading="Scan connection QR code"
        footer={
          <YStack alignItems="center" gap="$3">
            <Text textAlign="center" color="$colorLight">
              Scan the QR code containing the connection URL
            </Text>
            <SafeButton secondary icon={<SafeFontIcon name="edit" size={16} />} onPress={toggleQrScanner}>
              Enter manually
            </SafeButton>
          </YStack>
        }
      />
    )
  }

  return (
    <OpenLVProvider>
      <XStack
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="$borderLight"
      >
        <XStack alignItems="center" gap="$2">
          <Identicon address={activeSafe.address} size={20} />
          <Text fontSize={14} fontWeight="600">
            {activeSafe.address.substring(0, 6)}...{activeSafe.address.substring(activeSafe.address.length - 4)}
          </Text>
        </XStack>

        <XStack
          alignItems="center"
          gap="$2"
          backgroundColor="$backgroundSecondary"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
        >
          <View
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor={
              isLinked
                ? '$success'
                : status === 'connecting'
                  ? '$warning'
                  : status === 'error'
                    ? '$error'
                    : '$colorLight'
            }
          />
          <Text fontSize={12} color="$colorLight" textTransform="capitalize">
            {status.replace('session: ', '')}
          </Text>
        </XStack>
      </XStack>

      <YStack flex={1} padding="$4" justifyContent="space-between">
        <YStack gap="$4" width="100%">
          {isLinked ? (
            <YStack gap="$5" alignItems="center">
              <YStack padding="$5" backgroundColor="$backgroundSecondary" borderRadius="$10">
                <SafeFontIcon name="check" size={48} color="$success" />
              </YStack>
              <YStack gap="$2" alignItems="center">
                <Text fontSize="$6" fontWeight="bold">
                  Connected
                </Text>
                <Text color="$colorLight" textAlign="center" paddingHorizontal="$4">
                  The application is now linked. You can sign requests as they arrive.
                </Text>
              </YStack>
              <SafeButton danger onPress={closeSession} width="60%">
                Disconnect
              </SafeButton>
            </YStack>
          ) : (
            <YStack gap="$3">
              <Text fontSize="$3" color="$colorLight" fontWeight="600">
                Connection URL
              </Text>
              <View flexDirection="row" alignItems="center">
                <SafeInput
                  placeholder="Paste connection URL or scan QR code"
                  value={connectionUrl}
                  onChangeText={setConnectionUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  right={
                    connectionUrl ? (
                      <Pressable onPress={() => setConnectionUrl('')} style={{ paddingRight: 8 }}>
                        <SafeFontIcon name="close" size={16} color="$colorLight" />
                      </Pressable>
                    ) : null
                  }
                />
              </View>

              <XStack gap="$3" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                <SafeButton
                  flex={1}
                  minWidth={120}
                  secondary
                  icon={<SafeFontIcon name="qr-code" size={16} />}
                  onPress={toggleQrScanner}
                >
                  Scan QR
                </SafeButton>
                <SafeButton
                  flex={1}
                  minWidth={120}
                  onPress={session ? closeSession : startSession}
                  disabled={session ? false : !connectionUrl}
                  danger={!!session}
                >
                  {session ? 'Disconnect' : 'Connect'}
                </SafeButton>
              </XStack>
            </YStack>
          )}
        </YStack>

        {!isLinked && (
          <XStack gap="$1" alignItems="center" justifyContent="center" paddingVertical="$3">
            <Text fontSize={12} color="$colorSecondary">
              Powered by
            </Text>
            <OpenLVLogo width={60} height={16} />
          </XStack>
        )}
      </YStack>
    </OpenLVProvider>
  )
}

export default OpenLVView
