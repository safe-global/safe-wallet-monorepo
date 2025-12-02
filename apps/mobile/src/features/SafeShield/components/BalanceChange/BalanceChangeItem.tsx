import React from 'react'
import { Text, View, XStack } from 'tamagui'
import type { TokenAssetDetailsDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { Logo } from '@/src/components/Logo'
import { Badge } from '@/src/components/Badge'
import { useBalances } from '@/src/hooks/useBalances'
import { TokenType } from '@safe-global/store/gateway/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { EthAddress } from '@/src/components/EthAddress'
import type { Address } from '@/src/types/address'
import {
  isNftDiff,
  isNativeAsset,
  getAssetTypeLabel,
  type AssetType,
  type DiffType,
} from '@/src/features/SafeShield/components/BalanceChange/utils/utils'

interface BalanceChangeItemProps {
  asset: AssetType
  diff: DiffType
  positive?: boolean
}

export function BalanceChangeItem({ asset, diff, positive = false }: BalanceChangeItemProps) {
  const { balances } = useBalances()

  const logoUri =
    asset.logo_url ??
    balances?.items.find((item) => {
      return isNativeAsset(asset)
        ? item.tokenInfo.type === TokenType.NATIVE_TOKEN
        : sameAddress(item.tokenInfo.address, (asset as TokenAssetDetailsDto).address)
    })?.tokenInfo.logoUri

  const valueDisplay = isNftDiff(diff)
    ? `#${Number(diff.token_id)}`
    : diff.value
    ? `${positive ? '+' : '-'}${formatAmount(diff.value)}`
    : 'unknown'

  const typeLabel = getAssetTypeLabel(asset)

  return (
    <XStack alignItems="center" gap="$2" paddingVertical="$2">
      <Logo size="$5" logoUri={logoUri} imageBackground="$background" />

      {asset.symbol ? (
        <Text fontSize={14} fontWeight="700">
          {asset.symbol}
        </Text>
      ) : (
        !isNativeAsset(asset) && <EthAddress address={(asset as TokenAssetDetailsDto).address as Address} copy />
      )}

      <Badge
        themeName={positive ? 'badge_success_variant1' : 'badge_error'}
        circular={false}
        content={<Text fontSize={12}>{valueDisplay}</Text>}
      />

      <View flex={1} />

      <Badge themeName="badge_background" circular={false} content={<Text fontSize={12}>{typeLabel}</Text>} />
    </XStack>
  )
}
