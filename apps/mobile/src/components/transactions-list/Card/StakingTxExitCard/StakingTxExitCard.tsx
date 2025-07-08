import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Text } from 'tamagui'

interface StakingTxExitCardProps {
  info: NativeStakingValidatorsExitTransactionInfo
  onPress: () => void
}

export const StakingTxExitCard = ({ info, onPress }: StakingTxExitCardProps) => {
  return (
    <SafeListItem
      label={`Withdraw`}
      icon="transaction-stake"
      type={'Stake'}
      onPress={onPress}
      rightNode={
        <Text color="$color" fontWeight={600} textAlign="right">
          {info.numValidators} Validator{maybePlural(info.numValidators)}
        </Text>
      }
      leftNode={<TokenIcon logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
