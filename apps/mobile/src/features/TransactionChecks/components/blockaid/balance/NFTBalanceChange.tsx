import type {
  Erc1155Diff,
  Erc1155TokenDetails,
  Erc721Diff,
  Erc721TokenDetails,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { Text, View, XStack } from 'tamagui'
import React from 'react'
import { EthAddress } from '@/src/components/EthAddress'
import { Logo } from '@/src/components/Logo'
import { Address } from '@/src/types/address'
import { Badge } from '@/src/components/Badge'

export const NFTBalanceChange = ({
  change,
  asset,
}: {
  asset: Erc721TokenDetails | Erc1155TokenDetails
  change: Erc721Diff | Erc1155Diff
}) => {
  return (
    <>
      {asset.symbol ? (
        <XStack alignItems="center" gap="$2">
          <Logo size={'$5'} logoUri={asset.logo_url} />
          <Text fontSize={14} fontWeight="700" marginLeft="$1">
            {asset.symbol}
          </Text>
        </XStack>
      ) : (
        <Text fontSize={14} marginLeft="$1">
          <Logo size={'$5'} logoUri={asset.logo_url} />
          <EthAddress address={asset.address as Address} copy={true} />
        </Text>
      )}
      <Text fontSize={14} marginLeft="$1">
        #{Number(change.token_id)}
      </Text>
      <View flex={1} />
      <Badge themeName="badge_background" circular={false} content={<Text fontSize={12}>NFT</Text>} />
    </>
  )
}
