import React, { useState } from 'react'
import { Image } from 'expo-image'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SilentErrorBoundary } from '@/src/components/ErrorBoundary'
import { useAppSelector } from '@/src/store/hooks'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { useWalletConnectStatus } from '@/src/features/WalletConnect/hooks/useWalletConnectStatus'

type BadgeStatus = 'connected' | 'disconnected' | 'error'

interface WalletConnectBadgeProps {
  address: string
  size?: number
  statusSize?: number
  iconSize?: number
  testID?: string
  status?: BadgeStatus
  skipStatus?: boolean
  walletIcon?: string
}

export function WalletConnectBadge(props: WalletConnectBadgeProps) {
  return (
    <SilentErrorBoundary>
      <WalletConnectBadgeInner {...props} />
    </SilentErrorBoundary>
  )
}

const statusConfig = {
  connected: { icon: 'check-filled', color: '$success', bg: '$backgroundSuccess' },
  disconnected: { icon: 'alert-circle-filled', color: '$warning', bg: '$backgroundError' },
  error: { icon: 'close-filled', color: '$error', bg: '$backgroundError' },
} as const

function WalletConnectBadgeInner({
  address,
  size = 32,
  statusSize = size / 2,
  iconSize = 0.625 * size,
  testID,
  status,
  skipStatus,
  walletIcon,
}: WalletConnectBadgeProps) {
  const signer = useAppSelector((state) => selectSignerByAddress(state, address))
  const isConnected = useWalletConnectStatus(address)
  const [imageError, setImageError] = useState(false)
  const isWcSigner = signer?.type === 'walletconnect'

  const signerWalletIcon = isWcSigner ? signer.walletIcon : undefined
  const walletIconUrl = walletIcon ?? signerWalletIcon

  if (!walletIconUrl || imageError) {
    return null
  }

  const resolvedStatus = status ?? (isWcSigner ? (isConnected ? 'connected' : 'disconnected') : 'error')
  const { bg, icon: statusIcon, color } = statusConfig[resolvedStatus]

  const walletIconBadge = (
    <Badge
      content={
        <Image
          source={walletIconUrl}
          style={{ width: iconSize, height: iconSize, borderRadius: 150 }}
          onError={() => setImageError(true)}
        />
      }
      circleSize={size}
      circleProps={{ backgroundColor: skipStatus ? '$backgroundSkeleton' : bg }}
      testID={testID}
    />
  )

  if (skipStatus) {
    return walletIconBadge
  }

  const statusBadge = (
    <Badge
      content={<SafeFontIcon name={statusIcon} color={color} size={statusSize} />}
      circleSize={statusSize}
      circleProps={{ backgroundColor: '$backgroundLight' }}
    />
  )

  return (
    <BadgeWrapper badge={statusBadge} position="top-right">
      {walletIconBadge}
    </BadgeWrapper>
  )
}
