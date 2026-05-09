import React from 'react'
import { RESULTS, PermissionStatus } from 'react-native-permissions'
import { LedgerError } from '@/src/features/Ledger/components/LedgerError'
import { LedgerIcon, PhoneIcon } from '@/src/features/Ledger/icons'

interface BluetoothErrorProps {
  permissionStatus?: PermissionStatus | null
  errorMessage: string
  onRetry: () => void
  onOpenSettings?: () => void
}

export const BluetoothError = ({ permissionStatus, errorMessage, onRetry, onOpenSettings }: BluetoothErrorProps) => {
  const getErrorContent = () => {
    switch (permissionStatus) {
      case RESULTS.BLOCKED:
        return {
          title: 'Bluetooth Access Required',
          description:
            'Bluetooth permission is blocked. Please enable it in your device settings to connect to your Ledger device.',
          buttonText: 'Open App Settings',
          action: onOpenSettings || onRetry,
        }
      case RESULTS.DENIED:
        return {
          title: 'Bluetooth Permission Needed',
          description: 'This app needs Bluetooth access to connect to your Ledger device.',
          buttonText: 'Grant Permission',
          action: onRetry,
        }
      case RESULTS.UNAVAILABLE:
        return {
          title: 'Bluetooth Not Available',
          description: 'Your device does not support Bluetooth connectivity.',
          buttonText: 'Continue',
          action: onRetry,
        }
      default:
        return {
          title: 'Bluetooth Issue',
          description: 'There was a problem with Bluetooth connectivity.',
          buttonText: 'Try Again',
          action: onRetry,
        }
    }
  }

  const { title, description, buttonText, action } = getErrorContent()

  return (
    <LedgerError
      title={title}
      description={description}
      errorMessage={errorMessage}
      buttonText={buttonText}
      onRetry={action}
      testID="bluetooth-error-retry-button"
      icon={
        <>
          <LedgerIcon />
          <PhoneIcon />
        </>
      }
    />
  )
}
