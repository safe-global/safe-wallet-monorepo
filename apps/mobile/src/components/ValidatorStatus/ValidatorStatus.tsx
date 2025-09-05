import React from 'react'
import { View, Text } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { capitalize } from '@safe-global/utils/utils/formatters'
type NativeStakingStatus = NativeStakingDepositTransactionInfo['status']

interface ValidatorStatusConfig {
  themeName: 'badge_success_variant1' | 'badge_warning' | 'badge_error' | 'badge_background'
  icon: React.ComponentType
  text: string
}

const StatusConfigs: Record<NativeStakingStatus, ValidatorStatusConfig> = {
  NOT_STAKED: {
    themeName: 'badge_warning',
    icon: () => <SafeFontIcon name="signature" size={12} />,
    text: 'Signature needed',
  },
  ACTIVATING: {
    themeName: 'badge_background',
    icon: () => <SafeFontIcon name="clock" size={12} />,
    text: 'Activating',
  },
  DEPOSIT_IN_PROGRESS: {
    themeName: 'badge_background',
    icon: () => <SafeFontIcon name="clock" size={12} />,
    text: 'Awaiting entry',
  },
  ACTIVE: {
    themeName: 'badge_success_variant1',
    icon: () => <SafeFontIcon name="check-filled" size={12} />,
    text: 'Validating',
  },
  EXIT_REQUESTED: {
    themeName: 'badge_background',
    icon: () => <SafeFontIcon name="clock" size={12} />,
    text: 'Requested exit',
  },
  EXITING: {
    themeName: 'badge_background',
    icon: () => <SafeFontIcon name="clock" size={12} />,
    text: 'Request pending',
  },
  EXITED: {
    themeName: 'badge_success_variant1',
    icon: () => <SafeFontIcon name="check-filled" size={12} />,
    text: 'Withdrawn',
  },
  SLASHED: {
    themeName: 'badge_error',
    icon: () => <SafeFontIcon name="shield-crossed" size={12} />,
    text: 'Slashed',
  },
}

interface ValidatorStatusProps {
  status: NativeStakingStatus
}

export function ValidatorStatus({ status }: ValidatorStatusProps) {
  const config = StatusConfigs[status]

  if (!config) {
    return <Badge circular={false} themeName="badge_background" content={capitalize(status)} />
  }

  const { themeName, icon: IconComponent, text } = config

  return (
    <Badge
      circular={false}
      themeName={themeName}
      content={
        <View flexDirection="row" alignItems="center" gap="$1">
          <IconComponent />
          <Text fontSize="$2" color="$color">
            {text}
          </Text>
        </View>
      }
    />
  )
}
