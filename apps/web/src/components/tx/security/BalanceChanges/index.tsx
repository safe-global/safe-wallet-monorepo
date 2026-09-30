import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Chip } from '@/components/ui/chip'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { TokenType } from '@safe-global/store/gateway/types'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import ArrowDownwardIcon from '@/public/images/transactions/incoming.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import type {
  FungibleDiffDto,
  NftDiffDto,
  NativeAssetDetailsDto,
  TokenAssetDetailsDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

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

  return (
    <>
      <Typography variant="paragraph-small" className="mx-2">
        {change.value ? formatAmount(change.value) : 'unknown'}
      </Typography>
      <TokenIcon size={16} logoUri={logoUri} tokenSymbol={asset.symbol} />
      <Typography variant="paragraph-small-bold" className="ml-1 inline">
        {asset.symbol}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip size="auto" shape="tag">
        {asset.type}
      </Chip>
    </>
  )
}

const NFTBalanceChange = ({ change, asset }: { asset: TokenAssetDetailsDto; change: NftDiffDto }) => {
  const chainId = useChainId()

  return (
    <>
      {asset.symbol ? (
        <Typography variant="paragraph-small-bold" className="ml-2 inline">
          {asset.symbol}
        </Typography>
      ) : (
        <Typography variant="paragraph-small" className="ml-2">
          <EthHashInfo
            address={asset.address}
            chainId={chainId}
            showCopyButton={false}
            showPrefix={false}
            hasExplorer
            customAvatar={asset.logo_url}
            showAvatar={!!asset.logo_url}
            avatarSize={16}
            shortAddress
          />
        </Typography>
      )}
      <Typography variant="paragraph-small-bold" className={`${css.nftId} ml-2`}>
        #{Number(change.token_id)}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip size="auto" shape="tag">
        NFT
      </Chip>
    </>
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
    <div className="w-full">
      <div className={css.balanceChange}>
        {positive ? <ArrowDownwardIcon /> : <ArrowOutwardIcon />}
        {isNftDiff(diff) ? (
          <NFTBalanceChange asset={asset as TokenAssetDetailsDto} change={diff} />
        ) : (
          <FungibleBalanceChange asset={asset} change={diff} />
        )}
      </div>
    </div>
  )
}
const BalanceChangesDisplay = () => {
  const { threat } = useSafeShield()
  const [threatResults, threatError, threatLoading = false] = threat || []

  const balanceChange = threatResults?.BALANCE_CHANGE || []

  const totalBalanceChanges = balanceChange
    ? balanceChange.reduce((prev, current) => prev + current.in.length + current.out.length, 0)
    : 0

  if (threatLoading) {
    return (
      <div className={css.loader}>
        <Spinner className="size-[22px] text-[var(--color-text-secondary)]" />
        <Typography variant="paragraph-small" className="text-muted-foreground">
          Calculating...
        </Typography>
      </div>
    )
  }
  if (threatError) {
    return (
      <Typography variant="paragraph-small" className="text-muted-foreground justify-self-end">
        Could not calculate balance changes.
      </Typography>
    )
  }
  if (totalBalanceChanges === 0) {
    return (
      <Typography variant="paragraph-small" className="text-muted-foreground justify-self-end">
        No balance change detected
      </Typography>
    )
  }

  return (
    <div className={`flex flex-wrap ${css.balanceChanges}`}>
      <>
        {balanceChange?.map((change, assetIdx) => (
          <>
            {change.in.map((diff, changeIdx) => (
              <BalanceChange key={`${assetIdx}-in-${changeIdx}`} asset={change.asset} positive diff={diff} />
            ))}
            {change.out.map((diff, changeIdx) => (
              <BalanceChange key={`${assetIdx}-out-${changeIdx}`} asset={change.asset} diff={diff} />
            ))}
          </>
        ))}
      </>
    </div>
  )
}

export const BalanceChanges = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  if (!isFeatureEnabled) {
    return null
  }

  return (
    <div className={css.box}>
      <Typography variant="paragraph-small-bold" className="shrink-0">
        Balance change
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
              </span>
            }
          />
          <TooltipContent>
            The balance change gives an overview of the implications of a transaction. You can see which assets will be
            sent and received after the transaction is executed.
          </TooltipContent>
        </Tooltip>
      </Typography>
      <ObservabilityErrorBoundary fallback={<div>Error showing balance changes</div>}>
        <BalanceChangesDisplay />
      </ObservabilityErrorBoundary>
    </div>
  )
}
