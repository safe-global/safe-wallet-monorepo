import type {
  AssetDiff,
  Erc20Diff,
  NativeDiff,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { useBalances } from '@/src/hooks/useBalances'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Text, View, XStack } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { Badge } from '@/src/components/Badge'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import React from 'react'

export const FungibleBalanceChange = ({
  change,
  asset,
  positive,
}: {
  asset: AssetDiff['asset']
  change: Erc20Diff | NativeDiff
  positive?: boolean
}) => {
  const { balances } = useBalances()
  const logoUri =
    asset.logo_url ??
    balances?.items.find((item) => {
      return asset.type === 'NATIVE'
        ? item.tokenInfo.type === TokenType.NATIVE_TOKEN
        : sameAddress(item.tokenInfo.address, asset.address)
    })?.tokenInfo.logoUri

  return (
    <XStack alignItems="center" gap="$2">
      <Logo size={'$5'} logoUri={logoUri} />
      <Text fontSize={14} fontWeight="700" marginLeft="$1">
        {asset.symbol}
      </Text>
      <Badge
        themeName={positive ? 'badge_success_variant1' : 'badge_error'}
        circular={false}
        content={
          <Text fontSize={12}>
            {positive ? '+' : '-'} {change.value ? formatAmount(change.value) : 'unknown'}
          </Text>
        }
      />
      <View flex={1} />
      <Badge themeName="badge_background" circular={false} content={<Text fontSize={12}>{asset.type}</Text>} />
    </XStack>
  )
}
