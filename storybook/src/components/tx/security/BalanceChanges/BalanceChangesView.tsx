import type { ReactElement, ReactNode } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import { Chip } from '@/components/ui/chip'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import ArrowDownwardIcon from '@/public/images/transactions/incoming.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'

export type FungibleBalanceChangeViewProps = {
  value?: string | null
  logoUri?: string
  symbol?: string | null
  type: string
}

export const FungibleBalanceChangeView = ({ value, logoUri, symbol, type }: FungibleBalanceChangeViewProps) => {
  return (
    <>
      <Typography variant="paragraph-small" className="mx-2">
        {value ? formatAmount(value) : 'unknown'}
      </Typography>
      <TokenIcon size={16} logoUri={logoUri} tokenSymbol={symbol} />
      <Typography variant="paragraph-small-bold" className="ml-1 inline">
        {symbol}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip size="auto" shape="tag">
        {type}
      </Chip>
    </>
  )
}

export type NFTBalanceChangeViewProps = {
  symbol?: string | null
  address: string
  chainId: string
  logoUrl?: string | null
  tokenId: number
}

export const NFTBalanceChangeView = ({ symbol, address, chainId, logoUrl, tokenId }: NFTBalanceChangeViewProps) => {
  return (
    <>
      {symbol ? (
        <Typography variant="paragraph-small-bold" className="ml-2 inline">
          {symbol}
        </Typography>
      ) : (
        <Typography variant="paragraph-small" className="ml-2">
          <EthHashInfo
            address={address}
            chainId={chainId}
            showCopyButton={false}
            showPrefix={false}
            hasExplorer
            customAvatar={logoUrl}
            showAvatar={!!logoUrl}
            avatarSize={16}
            shortAddress
          />
        </Typography>
      )}
      <Typography variant="paragraph-small-bold" className={`${css.nftId} ml-2`}>
        #{tokenId}
      </Typography>
      <span style={{ margin: 'auto' }} />
      <Chip size="auto" shape="tag">
        NFT
      </Chip>
    </>
  )
}

export const BalanceChangeView = ({ positive, children }: { positive: boolean; children: ReactNode }) => {
  return (
    <div className="w-full">
      <div className={css.balanceChange}>
        {positive ? <ArrowDownwardIcon /> : <ArrowOutwardIcon />}
        {children}
      </div>
    </div>
  )
}

export type BalanceChangesDisplayViewProps = {
  isLoading: boolean
  hasError: boolean
  totalBalanceChanges: number
  changes: Array<{ incoming: ReactNode; outgoing: ReactNode }>
}

export const BalanceChangesDisplayView = ({
  isLoading,
  hasError,
  totalBalanceChanges,
  changes,
}: BalanceChangesDisplayViewProps) => {
  if (isLoading) {
    return (
      <div className={css.loader}>
        <Spinner className="size-[22px] text-[var(--color-text-secondary)]" />
        <Typography variant="paragraph-small" className="text-muted-foreground">
          Calculating...
        </Typography>
      </div>
    )
  }
  if (hasError) {
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
        {changes.map((change) => (
          <>
            {change.incoming}
            {change.outgoing}
          </>
        ))}
      </>
    </div>
  )
}

export const BalanceChangesErrorView = (): ReactElement => <div>Error showing balance changes</div>

export const BalanceChangesView = ({ children }: { children: ReactNode }) => {
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
      {children}
    </div>
  )
}
