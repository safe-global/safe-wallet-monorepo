import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useHasFeature } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Box, Chip, CircularProgress, Grid, SvgIcon, Tooltip, Typography } from '@mui/material'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { ErrorBoundary } from '@sentry/react'
import { useContext } from 'react'
import { TxSecurityContext } from '../shared/TxSecurityContext'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import ArrowDownwardIcon from '@/public/images/transactions/incoming.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { REDEFINE_ARTICLE } from '@/config/constants'

import css from './styles.module.css'
import type {
  AssetDiff,
  Erc1155Diff,
  Erc1155TokenDetails,
  Erc20Diff,
  Erc721Diff,
  Erc721TokenDetails,
  GeneralAssetDiff,
  NativeDiff,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { FEATURES } from '@safe-global/utils/utils/chains'

const FungibleBalanceChange = ({ change, asset }: { asset: AssetDiff['asset']; change: Erc20Diff | NativeDiff }) => {
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

const NFTBalanceChange = ({
  change,
  asset,
}: {
  asset: Erc721TokenDetails | Erc1155TokenDetails
  change: Erc721Diff | Erc1155Diff
}) => {
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

const BalanceChange = ({
  asset,
  positive = false,
  diff,
}: {
  asset: NonNullable<AssetDiff['asset']>
  positive?: boolean
  diff: GeneralAssetDiff
}) => {
  return (
    <Grid item xs={12} md={12}>
      <Box className={css.balanceChange}>
        {positive ? <ArrowDownwardIcon /> : <ArrowOutwardIcon />}
        {asset.type === 'ERC721' || asset.type === 'ERC1155' ? (
          <NFTBalanceChange asset={asset} change={diff as Erc721Diff | Erc1155Diff} />
        ) : (
          <FungibleBalanceChange asset={asset} change={diff as NativeDiff | Erc20Diff} />
        )}
      </Box>
    </Grid>
  )
}
const BalanceChanges = () => {
  const { blockaidResponse } = useContext(TxSecurityContext)
  const { isLoading, balanceChange, error } = blockaidResponse ?? {}

  const totalBalanceChanges = balanceChange
    ? balanceChange.reduce((prev, current) => prev + current.in.length + current.out.length, 0)
    : 0

  if (isLoading) {
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
  if (error) {
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

export const BlockaidBalanceChanges = () => {
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
              be sent and received after the transaction is executed.&nbsp;
              <ExternalLink href={REDEFINE_ARTICLE} title="Learn more about balance change">
                Learn more about balance change
              </ExternalLink>
              .
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
        <BalanceChanges />
      </ErrorBoundary>
    </div>
  )
}
