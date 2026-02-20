import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Box, Chip, CircularProgress, Grid, SvgIcon, Tooltip, Typography } from '@mui/material'
import { TokenType } from '@safe-global/store/gateway/types'
import { ErrorBoundary } from '@sentry/react'
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
      <Typography variant="body2" mx={1}>
        {change.value ? formatAmount(change.value) : 'unknown'}
      </Typography>
      <TokenIcon size={16} logoUri={logoUri} tokenSymbol={asset.symbol} />
      <Typography variant="body2" fontWeight={700} display="inline" ml={0.5}>
        {asset.symbol}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip className={css.categoryChip} label={asset.type} />
    </>
  )
}

const NFTBalanceChange = ({ change, asset }: { asset: TokenAssetDetailsDto; change: NftDiffDto }) => {
  const chainId = useChainId()

  return (
    <>
      {asset.symbol ? (
        <Typography variant="body2" fontWeight={700} display="inline" ml={1}>
          {asset.symbol}
        </Typography>
      ) : (
        <Typography variant="body2" ml={1}>
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
      <Typography variant="subtitle2" className={css.nftId} ml={1}>
        #{Number(change.token_id)}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip className={css.categoryChip} label="NFT" />
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
    <Grid item xs={12} md={12}>
      <Box className={css.balanceChange}>
        {positive ? <ArrowDownwardIcon /> : <ArrowOutwardIcon />}
        {isNftDiff(diff) ? (
          <NFTBalanceChange asset={asset as TokenAssetDetailsDto} change={diff} />
        ) : (
          <FungibleBalanceChange asset={asset} change={diff} />
        )}
      </Box>
    </Grid>
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
        <CircularProgress
          size={22}
          sx={{
            color: ({ palette }) => palette.text.secondary,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Calculating...
        </Typography>
      </div>
    )
  }
  if (threatError) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ justifySelf: 'flex-end' }}>
        Could not calculate balance changes.
      </Typography>
    )
  }
  if (totalBalanceChanges === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ justifySelf: 'flex-end' }}>
        No balance change detected
      </Typography>
    )
  }

  return (
    <Grid container className={css.balanceChanges}>
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
    </Grid>
  )
}

export const BalanceChanges = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)

  if (!isFeatureEnabled) {
    return null
  }

  return (
    <div className={css.box}>
      <Typography variant="subtitle2" fontWeight={700} flexShrink={0}>
        Balance change
        <Tooltip
          title={
            <>
              The balance change gives an overview of the implications of a transaction. You can see which assets will
              be sent and received after the transaction is executed.
            </>
          }
          arrow
          placement="top"
        >
          <span>
            <SvgIcon
              component={InfoIcon}
              inheritViewBox
              color="border"
              fontSize="small"
              sx={{
                verticalAlign: 'middle',
                ml: 0.5,
              }}
            />
          </span>
        </Tooltip>
      </Typography>
      <ErrorBoundary fallback={<div>Error showing balance changes</div>}>
        <BalanceChangesDisplay />
      </ErrorBoundary>
    </div>
  )
}
