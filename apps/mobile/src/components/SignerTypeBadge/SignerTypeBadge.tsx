import React from 'react'
import { Badge } from '@/src/components/Badge'
import { Skeleton } from 'moti/skeleton'
import { BadgeThemeTypes } from '@/src/components/Badge/Badge'
import { useAppSelector } from '@/src/store/hooks'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { SafeFontIcon } from '../SafeFontIcon'

interface SignerBadgeProps {
  address: `0x${string}`
  size?: number
  fontSize?: number
  theme?: BadgeThemeTypes
  isLoading?: boolean
  bordered?: boolean
  testID?: string
}

export const SignerTypeBadge = ({
  address,
  size = 24,
  fontSize = 10,
  theme = 'badge_warning',
  isLoading = false,
  bordered = false,
  testID,
}: SignerBadgeProps) => {
  const signer = useAppSelector((state) => selectSignerByAddress(state, address))

  if (isLoading) {
    return <Skeleton colorMode="dark" radius="round" height={size} width={size} />
  }

  if (signer?.type === 'ledger') {
    return (
      <Badge
        content={<SafeFontIcon name="hardware" size={12} color="$color" />}
        textContentProps={{
          fontSize,
          fontWeight: 500,
        }}
        circleSize={size}
        themeName={theme}
        circleProps={
          bordered
            ? {
                bordered: true,
                borderColor: '$colorContrast',
              }
            : undefined
        }
        testID={testID}
      />
    )
  }
  return null
}
