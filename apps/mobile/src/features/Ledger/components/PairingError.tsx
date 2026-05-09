import React from 'react'
import { LedgerError } from './LedgerError'
import { LedgerIcon, PhoneIcon } from '@/src/features/Ledger/icons'

interface PairingErrorProps {
  deviceName: string
  errorMessage: string
  onRetry: () => void
}

export const PairingError = ({ deviceName, errorMessage, onRetry }: PairingErrorProps) => {
  return (
    <LedgerError
      title="Pairing unsuccessful"
      description={`Make sure your ${deviceName} is close to your mobile phone, and try again.`}
      errorMessage={errorMessage}
      buttonText="Retry pairing"
      onRetry={onRetry}
      testID="retry-pairing-button"
      icon={
        <>
          <LedgerIcon />
          <PhoneIcon />
        </>
      }
    />
  )
}
