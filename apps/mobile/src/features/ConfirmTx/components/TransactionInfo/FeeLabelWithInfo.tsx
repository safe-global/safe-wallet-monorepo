import { Text, XStack } from 'tamagui'
import { InfoSheet } from '@/src/components/InfoSheet/InfoSheet'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface FeeLabelWithInfoProps {
  label: string
  title: string
  info: string
}

/**
 * A fee-row label with a trailing info icon that opens an explanatory bottom sheet. Shared by the
 * fees breakdown and the execute footer so the copy and affordance stay consistent.
 */
export const FeeLabelWithInfo = ({ label, title, info }: FeeLabelWithInfoProps) => (
  <InfoSheet title={title} info={info} displayIcon={false}>
    <XStack alignItems="center" gap="$1" flex={1}>
      <Text color="$textSecondaryLight" fontSize="$4">
        {label}
      </Text>
      <SafeFontIcon name="info" size={16} color="$colorSecondary" />
    </XStack>
  </InfoSheet>
)
