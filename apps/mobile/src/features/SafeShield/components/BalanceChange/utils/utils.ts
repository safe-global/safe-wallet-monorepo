import type {
  BalanceChangeDto,
  FungibleDiffDto,
  NftDiffDto,
  NativeAssetDetailsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

export type AssetType = BalanceChangeDto['asset']
export type DiffType = FungibleDiffDto | NftDiffDto

export const isNftDiff = (diff: DiffType): diff is NftDiffDto => {
  return 'token_id' in diff
}

export const isNativeAsset = (asset: AssetType): asset is NativeAssetDetailsDto => {
  return asset.type === 'NATIVE'
}

export const getAssetTypeLabel = (asset: AssetType): string => {
  if (isNativeAsset(asset)) {
    return 'Native'
  }
  if (asset.type === 'ERC721' || asset.type === 'ERC1155') {
    return 'NFT'
  }
  return asset.type
}
