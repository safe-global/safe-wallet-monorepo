import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography, Tooltip } from '@mui/material'
import type { Dispatch, SetStateAction, ReactElement, ChangeEvent } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'
import RemainingRelays from '../RemainingRelays'
import InfoIcon from '@mui/icons-material/Info'

import css from './styles.module.css'
import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import type { RelayCountResponse } from '@safe-global/safe-gateway-typescript-sdk'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const enum ExecutionMethod {
  RELAY = 'RELAY',
  WALLET = 'WALLET',
  NO_FEE_NOVEMBER = 'NO_FEE_NOVEMBER',
}

const _ExecutionMethodSelector = ({
  wallet,
  chain,
  executionMethod,
  setExecutionMethod,
  relays,
  noLabel,
  tooltip,
  noFeeNovember,
}: {
  wallet: ConnectedWallet | null
  chain?: Chain
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  relays?: RelayCountResponse
  noLabel?: boolean
  tooltip?: string
  noFeeNovember?: {
    isEligible: boolean
    remaining: number
    limit: number
  }
}): ReactElement | null => {
  const shouldRelay = executionMethod === ExecutionMethod.RELAY || executionMethod === ExecutionMethod.NO_FEE_NOVEMBER

  const onChooseExecutionMethod = (_: ChangeEvent<HTMLInputElement>, newExecutionMethod: string) => {
    setExecutionMethod(newExecutionMethod as ExecutionMethod)
  }

  return (
    <Box className={css.container} sx={{ borderRadius: ({ shape }) => `${shape.borderRadius}px` }}>
      <div className={css.method}>
        <FormControl sx={{ display: 'flex' }}>
          {!noLabel ? (
            <Typography variant="body2" className={css.label}>
              Who will pay gas fees:
            </Typography>
          ) : null}

          <RadioGroup row value={executionMethod} onChange={onChooseExecutionMethod} className={css.radioGroup}>
            <FormControlLabel
              data-testid="relay-execution-method"
              sx={{ flex: 1 }}
              value={noFeeNovember?.isEligible ? ExecutionMethod.NO_FEE_NOVEMBER : ExecutionMethod.RELAY}
              label={
                noFeeNovember?.isEligible ? (
                  <div className={css.noFeeNovemberLabel}>
                    <Typography className={css.mainLabel}>Sponsored gas</Typography>
                    <div className={css.subLabel}>
                      <Typography variant="body2" color="text.secondary">
                        Part of the No-Fee November, Safe Ecosystem Foundation sponsorship program.{' '}
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" color="inherit">
                                SAFE holders enjoy gasless transactions on Ethereum Mainnet this November.{' '}
                                <Typography component="span" fontWeight="bold">
                                  Learn more
                                </Typography>
                              </Typography>
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <InfoIcon className={css.infoIconInline} />
                        </Tooltip>
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <Typography className={css.radioLabel} whiteSpace="nowrap">
                    Sponsored by
                    <SponsoredBy chainId={chain?.chainId ?? ''} />
                  </Typography>
                )
              }
              control={<Radio />}
            />

            <FormControlLabel
              data-testid="connected-wallet-execution-method"
              sx={{ flex: 1 }}
              value={ExecutionMethod.WALLET}
              label={
                <Typography className={css.radioLabel}>
                  <WalletIcon provider={wallet?.label || ''} width={20} height={20} icon={wallet?.icon} /> Connected
                  wallet
                </Typography>
              }
              control={<Radio />}
            />
          </RadioGroup>
        </FormControl>
      </div>

      {shouldRelay && noFeeNovember?.isEligible ? (
        <Typography variant="body2" className={css.transactionCounter}>
          <span className={css.counterNumber}>{noFeeNovember.remaining}</span> free transactions left today
        </Typography>
      ) : shouldRelay && relays ? (
        <RemainingRelays relays={relays} tooltip={tooltip} />
      ) : wallet ? (
        <BalanceInfo />
      ) : null}
    </Box>
  )
}

export const ExecutionMethodSelector = madProps(_ExecutionMethodSelector, {
  wallet: useWallet,
  chain: useCurrentChain,
})
