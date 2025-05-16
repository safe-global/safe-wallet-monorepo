import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Logo } from '@/src/components/Logo'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Text } from 'tamagui'

export const StakingTxExitCard = ({ info }: { info: NativeStakingValidatorsExitTransactionInfo }) => {
  return (
    <SafeListItem
      label={`Withdraw`}
      icon="transaction-stake"
      type={'Stake'}
      rightNode={
        <Text color="$color" fontWeight={600} textAlign="right">
          {info.numValidators} Validator{maybePlural(info.numValidators)}
        </Text>
      }
      leftNode={<Logo logoUri={info.tokenInfo.logoUri} accessibilityLabel={info.tokenInfo.symbol} />}
    />
  )
}
