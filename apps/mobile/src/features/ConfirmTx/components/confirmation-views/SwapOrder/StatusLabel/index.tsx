import React, { ReactElement } from 'react'
import { View, Text } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { type BadgeThemeTypes } from '@/src/components/Badge/Badge'
import { OrderTransactionInfo as Order } from '@safe-global/store/gateway/types'

type CustomOrderStatuses = Order['status'] | 'partiallyFilled'
type Props = {
  status: CustomOrderStatuses
}

type StatusProps = {
  label: string
  themeName: BadgeThemeTypes
  icon: React.ReactElement | null
}

const statusMap: Record<CustomOrderStatuses, StatusProps> = {
  presignaturePending: {
    label: 'Execution needed',
    themeName: 'badge_warning',
    icon: <SafeFontIcon name="sign" size={14} color="$color" />,
  },
  fulfilled: {
    label: 'Filled',
    themeName: 'badge_success',
    icon: <SafeFontIcon name="check" size={14} color="$color" />,
  },
  open: {
    label: 'Open',
    themeName: 'badge_warning',
    icon: <SafeFontIcon name="clock" size={14} color="$color" />,
  },
  cancelled: {
    label: 'Cancelled',
    themeName: 'badge_error',
    icon: <SafeFontIcon name="block" size={14} color="$color" />,
  },
  expired: {
    label: 'Expired',
    themeName: 'badge_background',
    icon: <SafeFontIcon name="clock" size={14} color="$color" />,
  },
  partiallyFilled: {
    label: 'Partially filled',
    themeName: 'badge_success',
    icon: null,
  },
  unknown: {
    label: 'Unknown',
    themeName: 'badge_background',
    icon: null,
  },
}

export const StatusLabel = (props: Props): ReactElement => {
  const { status } = props
  const { label, themeName, icon } = statusMap[status]

  return (
    <View flexDirection="row" alignItems="center" gap="$2">
      <Badge
        circular={false}
        themeName={themeName}
        textContentProps={{ fontWeight: 500 }}
        content={
          <View flexDirection="row" alignItems="center" gap="$2">
            {icon}
            <Text color="$color">{label}</Text>
          </View>
        }
      />
    </View>
  )
}

export default StatusLabel
