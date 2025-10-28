import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'

import type { Dispatch, SetStateAction, ReactElement, ChangeEvent } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'

import RemainingRelays from '../RemainingRelays'
import css from './styles.module.css'
import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
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
  gasTooHigh,
}: {
  wallet: ConnectedWallet | null
  chain?: Chain
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  relays?: RelaysRemaining
  noLabel?: boolean
  tooltip?: string
  noFeeNovember?: {
    isEligible: boolean
    remaining: number
    limit: number
  }
  gasTooHigh?: boolean
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
            {(() => {
              const isLimitReached = noFeeNovember?.isEligible && noFeeNovember.remaining === 0
              const availabilityLabel = noFeeNovember?.limit
                ? `${noFeeNovember.remaining || 0}/${noFeeNovember.limit} available`
                : ''
              const isDisabled = gasTooHigh || isLimitReached

              return isDisabled ? (
                <Tooltip
                  title={
                    gasTooHigh
                      ? 'Gas prices are too high right now'
                      : 'You reached the limit of sponsored transactions per day.'
                  }
                  placement="top"
                  arrow
                >
                  <FormControlLabel
                    data-testid="relay-execution-method"
                    value={noFeeNovember?.isEligible ? ExecutionMethod.NO_FEE_NOVEMBER : ExecutionMethod.RELAY}
                    disabled
                    sx={{
                      flex: 1,
                      '& .MuiFormControlLabel-label': {
                        marginLeft: '10px',
                      },
                    }}
                    label={
                      noFeeNovember?.isEligible ? (
                        <div className={css.noFeeNovemberLabel}>
                          <Chip
                            label={isLimitReached ? availabilityLabel : 'Not available'}
                            size="small"
                            className={css.notAvailableChip}
                            sx={{
                              '& .MuiChip-label': {
                                padding: 0,
                              },
                            }}
                          />
                          <Typography className={css.notAvailableTitle}>Sponsored gas</Typography>
                          <div className={css.descriptionWrapper}>
                            <Typography className={css.descriptionText}>
                              Part of the No-Fee November, Safe Ecosystem Foundation sponsorship program.
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
                </Tooltip>
              ) : (
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
                                      <Link
                                        href="https://help.safe.global/en/articles/456540-no-fee-november"
                                        style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                                      >
                                        Learn more
                                      </Link>
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
              )
            })()}

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

        {/* Gas too high banner - shown inside method section when gas is too high */}
        {gasTooHigh && noFeeNovember?.isEligible && (
          <div className={css.gasBannerWrapper}>
            <GasTooHighBanner />
          </div>
        )}
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
