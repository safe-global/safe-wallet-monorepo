import React, { useState, useCallback } from 'react'
import { YStack, Text, XStack } from 'tamagui'
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
      <YStack flex={1} padding="$4" space="$4" justifyContent="center">
        <Text fontSize="$4" textAlign="center" fontWeight="bold">
          Sign Message Request
        </Text>
        <Text fontSize="$3" color="$colorLight" textAlign="center">
          The connected app requests you to sign:
        </Text>
        <YStack backgroundColor="$backgroundPress" padding="$4" borderRadius="$4">
          <Text fontFamily="$mono" textAlign="center">
            {displayMessage}
          </Text>
        </YStack>

        <XStack gap="$3" marginTop="$4">
          <SafeButton flex={1} danger onPress={rejectRequest}>
            Reject
          </SafeButton>
          <SafeButton flex={1} onPress={confirmRequest}>
            Sign
          </SafeButton>
        </XStack>
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
          <YStack alignItems="center" space="$3">
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
      <XStack backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$2" alignItems="center" gap="$2">
        <Identicon address={activeSafe.address} size={16} />
        <Text fontSize={12} color="$colorLight">
          {activeSafe.address.substring(0, 6)}...{activeSafe.address.substring(activeSafe.address.length - 4)}
        </Text>
      </XStack>

      <YStack
        flex={1}
        paddingBottom={'$4'}
        paddingHorizontal={'$4'}
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <YStack flex={1} justifyContent={'center'} alignItems={'center'} width="100%" space="$3">
          <YStack width="100%" gap="$3">
            <SafeInput
              placeholder="Paste connection URL or scan QR code"
              value={connectionUrl}
              onChangeText={setConnectionUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <XStack gap="$2">
              <SafeButton flex={1} secondary icon={<SafeFontIcon name="qr-code" size={16} />} onPress={toggleQrScanner}>
                Scan QR
              </SafeButton>
              <SafeButton
                flex={2}
                onPress={session ? closeSession : startSession}
                disabled={session ? false : !connectionUrl}
                danger={!!session}
              >
                {session ? 'Disconnect' : 'Connect'}
              </SafeButton>
            </XStack>

            <Text textAlign="center" fontSize={14} color="$colorLight">
              Status: {status}
            </Text>
          </YStack>
        </YStack>

        <YStack>
          <Text color={'$colorLight'} textAlign={'center'} fontSize={'$3'}>
            Powered by OpenLV
          </Text>
        </YStack>
      </YStack>
    </OpenLVProvider>
  )
}

export default OpenLVView
