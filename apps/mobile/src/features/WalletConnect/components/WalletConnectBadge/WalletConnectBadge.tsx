import React from 'react'
import { Image } from 'react-native'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { useWalletConnectStatus } from '@/src/features/WalletConnect/hooks/useWalletConnectStatus'

interface WalletConnectBadgeProps {
  address: string
  size?: number
  testID?: string
}

export function WalletConnectBadge({ address, size = 32, testID }: WalletConnectBadgeProps) {
  const signer = useAppSelector((state) => selectSignerByAddress(state, address))
  const isConnected = useWalletConnectStatus(address)

  if (signer?.type !== 'walletconnect' || !signer.walletIcon) {
    return null
  }

  const statusBadge = isConnected ? (
    <Badge
      content={<SafeFontIcon name="check-filled" size={16} color="$success" />}
      circleSize={16}
      circleProps={{ backgroundColor: '$backgroundLight' }}
    />
  ) : (
    <Badge
      content={<SafeFontIcon name="alert-circle-filled" size={16} color="$warning" />}
      circleSize={16}
      circleProps={{ backgroundColor: '$backgroundLight' }}
    />
  )

  return (
    <BadgeWrapper badge={statusBadge} position="top-right">
      <Badge
        content={<Image source={{ uri: signer.walletIcon }} style={{ width: 20, height: 20, borderRadius: 150 }} />}
        circleSize={size}
        circleProps={{ backgroundColor: isConnected ? '$backgroundSuccess' : '$backgroundError' }}
        testID={testID}
      />
    </BadgeWrapper>
  )
}
