import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { TokenType } from '@safe-global/store/gateway/types'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import type {
  FungibleDiffDto,
  NftDiffDto,
  NativeAssetDetailsDto,
  TokenAssetDetailsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import {
  BalanceChangeView,
  BalanceChangesDisplayView,
  BalanceChangesErrorView,
  BalanceChangesView,
  FungibleBalanceChangeView,
  NFTBalanceChangeView,
} from '@views/components/tx/security/BalanceChanges/BalanceChangesView'

const FungibleBalanceChange = ({
  change,
  asset,
}: {
  asset: NativeAssetDetailsDto | TokenAssetDetailsDto
  change: FungibleDiffDto
}) => {
  const { balances } = useBalances()
  const logoUri =
    asset.logo_url ??
    balances.items.find((item) => {
      return asset.type === 'NATIVE'
        ? item.tokenInfo.type === TokenType.NATIVE_TOKEN
        : sameAddress(item.tokenInfo.address, asset.address)
    })?.tokenInfo.logoUri

  return <FungibleBalanceChangeView value={change.value} logoUri={logoUri} symbol={asset.symbol} type={asset.type} />
}

const NFTBalanceChange = ({ change, asset }: { asset: TokenAssetDetailsDto; change: NftDiffDto }) => {
  const chainId = useChainId()

  return (
    <NFTBalanceChangeView
      symbol={asset.symbol}
      address={asset.address}
      chainId={chainId}
      logoUrl={asset.logo_url}
      tokenId={Number(change.token_id)}
    />
  )
}

const isNftDiff = (diff: FungibleDiffDto | NftDiffDto): diff is NftDiffDto => {
  return 'token_id' in diff
}

const BalanceChange = ({
  asset,
  positive = false,
  diff,
}: {
  asset: NativeAssetDetailsDto | TokenAssetDetailsDto
  positive?: boolean
  diff: FungibleDiffDto | NftDiffDto
}) => {
  return (
    <BalanceChangeView positive={positive}>
      {isNftDiff(diff) ? (
        <NFTBalanceChange asset={asset as TokenAssetDetailsDto} change={diff} />
      ) : (
        <FungibleBalanceChange asset={asset} change={diff} />
      )}
    </BalanceChangeView>
  )
}
const BalanceChangesDisplay = () => {
  const { threat } = useSafeShield()
  const [threatResults, threatError, threatLoading = false] = threat || []

  const balanceChange = threatResults?.BALANCE_CHANGE || []

  const totalBalanceChanges = balanceChange
    ? balanceChange.reduce((prev, current) => prev + current.in.length + current.out.length, 0)
    : 0

  return (
    <BalanceChangesDisplayView
      isLoading={threatLoading}
      hasError={!!threatError}
      totalBalanceChanges={totalBalanceChanges}
      changes={balanceChange.map((change, assetIdx) => ({
        incoming: change.in.map((diff, changeIdx) => (
          <BalanceChange key={`${assetIdx}-in-${changeIdx}`} asset={change.asset} positive diff={diff} />
        )),
        outgoing: change.out.map((diff, changeIdx) => (
          <BalanceChange key={`${assetIdx}-out-${changeIdx}`} asset={change.asset} diff={diff} />
        )),
      }))}
    />
  )
}

export const BalanceChanges = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  if (!isFeatureEnabled) {
    return null
  }

  return (
    <BalanceChangesView>
      <ObservabilityErrorBoundary fallback={<BalanceChangesErrorView />}>
        <BalanceChangesDisplay />
      </ObservabilityErrorBoundary>
    </BalanceChangesView>
  )
}
