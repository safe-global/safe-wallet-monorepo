import type {
  AssetDiff,
  Erc1155Diff,
  Erc20Diff,
  Erc721Diff,
  GeneralAssetDiff,
  NativeDiff,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { XStack } from 'tamagui'
import React from 'react'
import { NFTBalanceChange } from '@/src/features/TransactionChecks/components/blockaid/balance/NFTBalanceChange'
import { FungibleBalanceChange } from '@/src/features/TransactionChecks/components/blockaid/balance/FungibleBalanceChange'

export const BalanceChange = ({
  asset,
  positive = false,
  diff,
}: {
  asset: NonNullable<AssetDiff['asset']>
  positive?: boolean
  diff: GeneralAssetDiff
}) => {
  return (
    <XStack alignItems="center" paddingVertical="$1">
      {asset.type === 'ERC721' || asset.type === 'ERC1155' ? (
        <NFTBalanceChange asset={asset} change={diff as Erc721Diff | Erc1155Diff} />
      ) : (
        <FungibleBalanceChange asset={asset} change={diff as NativeDiff | Erc20Diff} positive={positive} />
      )}
    </XStack>
  )
}
