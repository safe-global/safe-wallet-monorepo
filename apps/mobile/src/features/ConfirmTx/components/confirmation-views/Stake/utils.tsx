import { Badge } from '@/src/components/Badge'
import { Logo } from '@/src/components/Logo'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ellipsis } from '@/src/utils/formatters'
import { Text, View } from 'tamagui'

const MOCKED_LOGO = 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png'

// TODO: this function will be replaced for the staking item
export const formatStakingItems = () => {
  return [
    {
      label: 'Rewards rate',
      value: '1.27%',
    },
    {
      label: 'Surplus',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text>0.41ETH</Text>
          <Text color="$textSecondaryLight">($1.089.25)</Text>
        </View>
      ),
    },
    {
      label: 'Expiry',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text>0.03 ETH</Text>
          <Text color="$textSecondaryLight">($90.25)</Text>
        </View>
      ),
    },
    {
      label: 'Widget fee',
      value: '0.07%',
    },
    {
      label: 'Contract',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={MOCKED_LOGO} size="$6" />
          <Text fontSize="$4">{ellipsis(' Kiln Vault (Aave V3 USDC)', 10)}</Text>
          <SafeFontIcon name="copy" size={14} color="$textSecondaryLight" />
          <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
        </View>
      ),
    },
    {
      label: 'Network',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={MOCKED_LOGO} size="$6" />
          <Text fontSize="$4">Ethereum</Text>
        </View>
      ),
    },
    {
      label: 'Status',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Badge
            circular={false}
            themeName="badge_warning_variant1"
            textContentProps={{ fontWeight: 500 }}
            content={
              <View flexDirection="row" alignItems="center" gap="$2">
                <SafeFontIcon name="sign" size={14} color="$color" />
                <Text color="$color">Signature needed</Text>
              </View>
            }
          />
        </View>
      ),
    },
  ]
}
