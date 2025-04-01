import type { ReactElement } from 'react'
import React, { useMemo } from 'react'
import type { Custom, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import SpendingLimitLabel from '@/components/common/SpendingLimitLabel'
import { useCurrentChain } from '@/hooks/useChains'
import { selectTokens } from '@/store/balancesSlice'
import { useAppSelector } from '@/store'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitMethods } from '@/utils/transaction-guards'
import { isSetAllowance } from '@/utils/transaction-guards'
import css from './styles.module.css'
import chains from '@/config/chains'

type SpendingLimitsProps = {
  txData?: TransactionData
  txInfo: Custom
  type: SpendingLimitMethods
}

export const SpendingLimits = ({ txData, txInfo, type }: SpendingLimitsProps): ReactElement | null => {
  const chain = useCurrentChain()
  const tokens = useAppSelector(selectTokens)
  const isSetAllowanceMethod = useMemo(() => isSetAllowance(type), [type])

  const [beneficiary, tokenAddress, amount, resetTimeMin] =
    txData?.dataDecoded?.parameters?.map(({ value }) => value) || []

  const resetTimeLabel = useMemo(
    () => getResetTimeOptions(chain?.chainId).find(({ value }) => +value === +resetTimeMin)?.label,
    [chain?.chainId, resetTimeMin],
  )
  const tokenInfo = useMemo(
    () => tokens.find(({ address }) => sameAddress(address, tokenAddress as string)),
    [tokenAddress, tokens],
  )
  const txTo = txInfo.to

  if (!txData) return null

  return (
    <Box className={css.container}>
      <Typography>
        <b>{`${isSetAllowanceMethod ? 'Modify' : 'Delete'} spending limit:`}</b>
      </Typography>
      <Box className={css.group}>
        <Typography sx={({ palette }) => ({ color: palette.primary.light })}>Beneficiary</Typography>
        <EthHashInfo
          address={(beneficiary as string) || txTo?.value || '0x'}
          name={txTo.name}
          customAvatar={txTo.logoUri}
          shortAddress={false}
          showCopyButton
          hasExplorer
        />
      </Box>
      <Box className={css.group}>
        <Typography sx={({ palette }) => ({ color: palette.primary.light })}>
          {isSetAllowanceMethod ? (tokenInfo ? 'Amount' : 'Raw Amount (in decimals)') : 'Token'}
        </Typography>
        <Box className={css.inline}>
          {tokenInfo && (
            <>
              <TokenIcon logoUri={tokenInfo.logoUri} size={32} tokenSymbol={tokenInfo.symbol} />
              <Typography>{tokenInfo.symbol}</Typography>
            </>
          )}

          {isSetAllowanceMethod && (
            <>
              {tokenInfo ? (
                <Typography>
                  {formatVisualAmount(amount as string, tokenInfo.decimals)} {tokenInfo.symbol}
                </Typography>
              ) : (
                <Typography>{amount}</Typography>
              )}
            </>
          )}
        </Box>
      </Box>
      {isSetAllowanceMethod && (
        <Box className={css.group}>
          <Typography sx={({ palette }) => ({ color: palette.primary.light })}>Reset time</Typography>
          <SpendingLimitLabel label={resetTimeLabel || 'One-time spending limit'} isOneTime={!resetTimeLabel} />
        </Box>
      )}
    </Box>
  )
}

const RESET_TIME_OPTIONS = [
  { label: 'One time', value: '0' },
  { label: '1 day', value: '1440' },
  { label: '1 week', value: '10080' },
  { label: '1 month', value: '43200' },
]

const TEST_RESET_TIME_OPTIONS = [
  { label: 'One time', value: '0' },
  { label: '5 minutes', value: '5' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
]

export const getResetTimeOptions = (chainId = ''): { label: string; value: string }[] => {
  return chainId === chains.gor || chainId === chains.sep ? TEST_RESET_TIME_OPTIONS : RESET_TIME_OPTIONS
}

export default SpendingLimits
