import type { ReactElement, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import classNames from 'classnames'
import css from './styles.module.css'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import { FiatChange } from './FiatChange'
import { FiatBalance } from './FiatBalance'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import TokenAmount from '@/components/common/TokenAmount'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  asset: {
    rawValue: '0x0',
    content: (
      <div className={css.token}>
        <Skeleton className="h-[26px] w-[26px] rounded-md" />
        <Typography as="div">
          <Skeleton className="h-4 w-[80px]" />
        </Typography>
      </div>
    ),
  },
  price: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  weight: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  actions: {
    rawValue: '',
    content: (
      <div className="flex flex-row justify-end gap-2">
        <Skeleton className="h-[28px] w-[28px] rounded-md" />
        <Skeleton className="h-[28px] w-[28px] rounded-md" />
        <Skeleton className="h-[24px] w-[24px] rounded-md" />
      </div>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

export type AssetsTableItem = {
  item: Balance
  isSelected: boolean
  shareOfFiatTotal: number | null
}

export type AssetsTableViewProps = {
  items: AssetsTableItem[]
  loading: boolean
  isMobile: boolean
  showHiddenAssets: boolean
  hiddenTokensInfo: ReactNode
  renderAssetRow: (item: Balance) => ReactNode
  renderMobileActions: (item: Balance) => ReactNode
  renderActions: (item: Balance, isSelected: boolean) => ReactNode
}

export const AssetsTableView = ({
  items,
  loading,
  isMobile,
  showHiddenAssets,
  hiddenTokensInfo,
  renderAssetRow,
  renderMobileActions,
  renderActions,
}: AssetsTableViewProps): ReactElement => {
  const headCells = [
    { id: 'asset', label: 'Asset', width: '35%' },
    { id: 'price', label: 'Price', width: '16%', align: 'right' },
    { id: 'balance', label: 'Balance', width: '16%', align: 'right' },
    {
      id: 'weight',
      label: (
        <Tooltip>
          <TooltipTrigger render={<span>Weight</span>} />
          <TooltipContent>Based on total portfolio value</TooltipContent>
        </Tooltip>
      ),
      width: '16%',
      align: 'right',
    },
    { id: 'value', label: 'Value', width: '17%', align: 'right' },
    { id: 'actions', label: 'Actions', width: showHiddenAssets ? '130px' : '86px', align: 'right', disableSort: true },
  ]

  const rows = loading
    ? skeletonRows
    : items.map(({ item, isSelected, shareOfFiatTotal }) => {
        const rawFiatValue = parseFloat(item.fiatBalance)
        const rawPriceValue = parseFloat(item.fiatConversion)

        return {
          key: item.tokenInfo.address,
          selected: isSelected,
          cells: {
            asset: {
              rawValue: item.tokenInfo.name,
              content: (
                <div>
                  {renderAssetRow(item)}
                  {renderMobileActions(item)}
                </div>
              ),
            },
            price: {
              rawValue: rawPriceValue,
              content: (
                <Typography className="text-right">
                  <FiatValue value={item.fiatConversion == '0' ? null : item.fiatConversion} />
                </Typography>
              ),
            },
            balance: {
              rawValue: Number(item.balance) / 10 ** (item.tokenInfo.decimals ?? 0),
              content: (
                <Typography className={css.balanceColumn} data-testid="token-balance">
                  <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} />
                </Typography>
              ),
            },
            weight: {
              rawValue: shareOfFiatTotal,
              content: shareOfFiatTotal ? (
                <Typography className="text-right">{formatPercentage(shareOfFiatTotal)}</Typography>
              ) : (
                <></>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              content: (
                <div className="text-right">
                  <Typography as="div">
                    <FiatBalance balanceItem={item} />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="paragraph-small">
                      <FiatChange balanceItem={item} inline />
                    </Typography>
                  )}
                </div>
              ),
            },
            actions: {
              rawValue: '',
              content: renderActions(item, isSelected),
            },
          },
        }
      })

  return isMobile ? (
    // eslint-disable-next-line no-restricted-syntax -- transparent 4px border reserves space for the row hover outline; not a card surface
    <Card size="none" className="mb-4 border-4 border-transparent">
      <div className={css.mobileContainer}>
        <div className={css.mobileHeader}>
          <Typography variant="paragraph-small" color="muted">
            Asset
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Value
          </Typography>
        </div>
        {loading
          ? Array(3)
              .fill(null)
              .map((_, index) => (
                <div key={index} className={css.mobileRow}>
                  <Skeleton className="h-[80px] w-full rounded-md" />
                </div>
              ))
          : items.map(({ item }) => (
              <div key={item.tokenInfo.address} className={css.mobileRow}>
                {renderAssetRow(item)}
                {renderMobileActions(item)}
              </div>
            ))}
      </div>
      <div className="px-4 pt-4 pb-4">{hiddenTokensInfo}</div>
    </Card>
  ) : (
    // eslint-disable-next-line no-restricted-syntax -- transparent 4px border reserves space for the row hover outline; not a card surface
    <Card size="none" className="mb-4 border-4 border-transparent">
      <div className={classNames(css.container, { [css.containerWideActions]: showHiddenAssets })}>
        <EnhancedTable rows={rows} headCells={headCells} compact footer={hiddenTokensInfo} />
      </div>
    </Card>
  )
}
