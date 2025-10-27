import { type ReactElement, useMemo, useState } from 'react'
import {
  Box,
  Card,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Skeleton,
  Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenIcon from '@/components/common/TokenIcon'
import IframeIcon from '@/components/common/IframeIcon'
import FiatValue from '@/components/common/FiatValue'
import { FiatChange } from '../AssetsTable/FiatChange'
import ChainIndicator from '@/components/common/ChainIndicator'
import usePortfolio from '@/hooks/usePortfolio'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { type AppBalance, type AppPosition } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import AddFundsCTA from '@/components/common/AddFunds'
import AssetDetailsDrawer from '../AssetDetailsDrawer'
import css from './styles.module.css'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  asset: {
    rawValue: '0x0',
    content: (
      <div className={css.token}>
        <Skeleton variant="rounded" width="26px" height="26px" />
        <Typography>
          <Skeleton width="80px" />
        </Typography>
      </div>
    ),
  },
  price: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  symbol: {
    rawValue: '',
    content: (
      <Typography>
        <Skeleton width="20px" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(5).fill({ cells: skeletonCells })

const headCells = [
  {
    id: 'asset',
    label: 'Asset',
    width: '35%',
  },
  {
    id: 'price',
    label: 'Price',
    width: '15%',
    align: 'right',
  },
  {
    id: 'balance',
    label: 'Balance',
    width: '25%',
    align: 'right',
  },
  {
    id: 'symbol',
    label: '',
    width: '10%',
    align: 'left',
  },
  {
    id: 'value',
    label: 'Value',
    width: '15%',
    align: 'right',
  },
]

const MultichainPortfolioTable = (): ReactElement => {
  const portfolio = usePortfolio()
  const [selectedAsset, setSelectedAsset] = useState<{
    item: Balance | AppPosition
    type: 'token' | 'position'
  } | null>(null)

  const allTokens = useMemo(() => portfolio.allChainsTokenBalances || [], [portfolio.allChainsTokenBalances])
  const allPositions = useMemo(() => portfolio.allChainsPositionBalances || [], [portfolio.allChainsPositionBalances])
  const totalPortfolioValue = parseFloat(portfolio.allChainsTotalBalance || '0')

  const hasNoAssets = !portfolio.isLoading && allTokens.length === 0 && allPositions.length === 0

  // Sort tokens by fiat value (descending)
  const sortedTokens = useMemo(() => {
    return [...allTokens].sort((a, b) => {
      const aValue = parseFloat(a.fiatBalance || '0')
      const bValue = parseFloat(b.fiatBalance || '0')
      return bValue - aValue
    })
  }, [allTokens])

  // Sort positions by protocol value (descending)
  const sortedPositions = useMemo(() => {
    return [...allPositions].sort((a, b) => {
      const aValue = a.balanceFiat || 0
      const bValue = b.balanceFiat || 0
      return bValue - aValue
    })
  }, [allPositions])

  const tokenRows = portfolio.isLoading
    ? skeletonRows
    : sortedTokens.map((item: Balance) => {
        const rawFiatValue = parseFloat(item.fiatBalance)
        const rawPriceValue = parseFloat(item.fiatConversion)

        return {
          key: `${item.tokenInfo.chainId}-${item.tokenInfo.address}`,
          onClick: () => setSelectedAsset({ item, type: 'token' }),
          cells: {
            asset: {
              rawValue: item.tokenInfo.name,
              content: (
                <div className={css.token}>
                  <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} size={40} />
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography fontWeight="bold">{item.tokenInfo.name}</Typography>
                    </Stack>
                    <div className={css.chainBadge}>
                      <ChainIndicator chainId={(item.tokenInfo as any).chainId || ''} inline showLogo imageSize={16} />
                    </div>
                  </Stack>
                </div>
              ),
            },
            price: {
              rawValue: rawPriceValue,
              content: (
                <Typography textAlign="right">
                  <FiatValue value={item.fiatConversion == '0' ? null : item.fiatConversion} />
                </Typography>
              ),
            },
            balance: {
              rawValue: Number(item.balance),
              content: (
                <Typography fontWeight={400} textAlign="right">
                  {formatAmount(item.balance)}
                </Typography>
              ),
            },
            symbol: {
              rawValue: item.tokenInfo.symbol,
              content: (
                <Typography fontWeight={400} color="primary.light" className={css.symbol}>
                  {item.tokenInfo.symbol}
                </Typography>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              content: (
                <Box textAlign="right">
                  <Typography>
                    <FiatValue value={item.fiatBalance} precise />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="caption">
                      <FiatChange change={item.fiatBalance24hChange} inline />
                    </Typography>
                  )}
                </Box>
              ),
            },
          },
        }
      })

  if (hasNoAssets) {
    return <AddFundsCTA />
  }

  return (
    <Stack gap={2}>
      {/* Tokens Section */}
      {allTokens.length > 0 && (
        <Card sx={{ px: 2 }}>
          <Box py={2}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="h4" fontWeight={700}>
                Tokens
              </Typography>
              {totalPortfolioValue > 0 && (
                <Tooltip title="Based on total portfolio value" placement="top" arrow>
                  <Typography variant="caption" className={css.weightBadge}>
                    {formatPercentage(parseFloat(portfolio.allChainsTotalTokenBalance || '0') / totalPortfolioValue)}
                  </Typography>
                </Tooltip>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {allTokens.length} {allTokens.length === 1 ? 'token' : 'tokens'} across all chains
            </Typography>
          </Box>
          <div className={css.container}>
            <EnhancedTable rows={tokenRows} headCells={headCells} compact />
          </div>
        </Card>
      )}

      {/* Positions Section */}
      {allPositions.length > 0 && (
        <Box>
          <Box mb={2}>
            <Typography variant="h4" fontWeight={700} mb={1}>
              Positions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allPositions.length} {allPositions.length === 1 ? 'protocol' : 'protocols'} with active positions
            </Typography>
          </Box>

          {sortedPositions.map((protocol: AppBalance) => {
            const protocolShareOfTotal = totalPortfolioValue ? (protocol.balanceFiat || 0) / totalPortfolioValue : null

            const positionHeadCells = [
              {
                id: 'name',
                label: (
                  <Typography variant="body2" fontWeight="bold" color="text.primary">
                    Positions
                  </Typography>
                ),
                width: '50%',
                disableSort: true,
              },
              { id: 'balance', label: 'Balance', width: '25%', align: 'right', disableSort: true },
              { id: 'symbol', label: '', width: '10%', align: 'left', disableSort: true },
              { id: 'value', label: 'Value', width: '15%', align: 'right', disableSort: true },
            ]

            const positionRows = protocol.positions.map((position) => {
              return {
                onClick: () => setSelectedAsset({ item: position, type: 'position' }),
                cells: {
                  name: {
                    content: (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <IframeIcon
                          src={position.tokenInfo.logoUri || ''}
                          alt={position.tokenInfo.name + ' icon'}
                          width={40}
                          height={40}
                        />
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" fontWeight="bold">
                              {position.name}
                            </Typography>
                            <Typography variant="body2" color="primary.light">
                              {position.type}
                            </Typography>
                          </Stack>
                          <div className={css.chainBadgeSecondary}>
                            <ChainIndicator chainId={position.tokenInfo.chainId || ''} inline showLogo imageSize={16} />
                          </div>
                        </Stack>
                      </Stack>
                    ),
                    rawValue: position.name,
                  },
                  balance: {
                    content: (
                      <Typography fontWeight={400} textAlign="right">
                        {formatAmount(position.balance)}
                      </Typography>
                    ),
                    rawValue: position.balance,
                  },
                  symbol: {
                    content: (
                      <Typography fontWeight={400} color="primary.light" className={css.symbol}>
                        {position.tokenInfo.symbol}
                      </Typography>
                    ),
                    rawValue: position.tokenInfo.symbol,
                  },
                  value: {
                    content: (
                      <Box textAlign="right">
                        <Typography>
                          <FiatValue value={position.balanceFiat?.toString() || '0'} precise />
                        </Typography>
                        <Typography variant="caption">
                          <FiatChange change={position.priceChangePercentage1d} inline />
                        </Typography>
                      </Box>
                    ),
                    rawValue: position.balanceFiat?.toString() || '0',
                  },
                },
              }
            })

            return (
              <Card key={protocol.appInfo.name} sx={{ border: 0, mb: 2 }}>
                <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{ justifyContent: 'center', overflowX: 'auto', backgroundColor: 'transparent !important' }}
                  >
                    <Stack direction="row" gap={1} alignItems="center" width={1}>
                      <div className={css.protocolIcon}>
                        <IframeIcon
                          src={protocol.appInfo.logoUrl || ''}
                          alt={protocol.appInfo.name}
                          width={32}
                          height={32}
                        />
                      </div>
                      <Typography fontWeight="bold" ml={0.5}>
                        {protocol.appInfo.name}
                      </Typography>
                      {protocolShareOfTotal && (
                        <Tooltip title="Based on total portfolio value" placement="top" arrow>
                          <Typography variant="caption" className={css.weightBadge}>
                            {formatPercentage(protocolShareOfTotal)}
                          </Typography>
                        </Tooltip>
                      )}
                      <Typography fontWeight="bold" mr={1} ml="auto" justifySelf="flex-end">
                        <FiatValue value={(protocol.balanceFiat || 0).toString()} maxLength={20} precise />
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 0 }}>
                    <EnhancedTable rows={positionRows} headCells={positionHeadCells} compact />
                  </AccordionDetails>
                </Accordion>
              </Card>
            )
          })}
        </Box>
      )}

      {/* Asset Details Drawer */}
      <AssetDetailsDrawer
        asset={selectedAsset?.item || null}
        assetType={selectedAsset?.type || 'token'}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </Stack>
  )
}

export default MultichainPortfolioTable
