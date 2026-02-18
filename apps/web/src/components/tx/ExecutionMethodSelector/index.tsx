import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography, Tooltip, Chip, Link } from '@mui/material'
import type { Dispatch, SetStateAction, ReactElement, ChangeEvent } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'

import RemainingRelays from '../RemainingRelays'
import InfoIcon from '@mui/icons-material/Info'
import { NoFeeCampaignFeature } from '@/features/no-fee-campaign'
import { useLoadFeature } from '@/features/__core__'

import css from './styles.module.css'
import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const enum ExecutionMethod {
  RELAY = 'RELAY',
  WALLET = 'WALLET',
  NO_FEE_CAMPAIGN = 'NO_FEE_CAMPAIGN',
}

// Wrapper component to load GasTooHighBanner (follows React naming conventions)
const GasTooHighBannerLoader = () => {
  const { GasTooHighBanner } = useLoadFeature(NoFeeCampaignFeature)
  return <GasTooHighBanner />
}

const _ExecutionMethodSelector = ({
  wallet,
  chain,
  executionMethod,
  setExecutionMethod,
  relays,
  noLabel,
  tooltip,
  noFeeCampaign,
  gasTooHigh,
}: {
  wallet: ConnectedWallet | null
  chain?: Chain
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  relays?: RelaysRemaining
  noLabel?: boolean
  tooltip?: string
  noFeeCampaign?: {
    isEligible: boolean
    remaining: number
    limit: number
  }
  gasTooHigh?: boolean
}): ReactElement | null => {
  const shouldRelay = executionMethod === ExecutionMethod.RELAY || executionMethod === ExecutionMethod.NO_FEE_CAMPAIGN

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
              const isLimitReached = noFeeCampaign?.isEligible && noFeeCampaign.remaining === 0
              const availabilityLabel = noFeeCampaign?.limit
                ? `${noFeeCampaign.remaining || 0}/${noFeeCampaign.limit} available`
                : ''
              const isDisabled = gasTooHigh || isLimitReached

              return isDisabled ? (
                <Tooltip
                  title={
                    gasTooHigh
                      ? 'Gas prices are too high right now'
                      : 'You reached the limit of sponsored transactions.'
                  }
                  placement="top"
                  arrow
                >
                  <FormControlLabel
                    data-testid="relay-execution-method"
                    value={noFeeCampaign?.isEligible ? ExecutionMethod.NO_FEE_CAMPAIGN : ExecutionMethod.RELAY}
                    disabled
                    sx={{
                      flex: 1,
                      '& .MuiFormControlLabel-label': {
                        marginLeft: '10px',
                      },
                    }}
                    label={
                      noFeeCampaign?.isEligible ? (
                        <div className={css.noFeeCampaignLabel}>
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
                              Part of the Free January, Safe Foundation&apos;s gas sponsorship program for USDe holders
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
                  value={noFeeCampaign?.isEligible ? ExecutionMethod.NO_FEE_CAMPAIGN : ExecutionMethod.RELAY}
                  label={
                    noFeeCampaign?.isEligible ? (
                      <div className={css.noFeeCampaignLabel}>
                        <Typography className={css.mainLabel}>Sponsored gas</Typography>
                        <div className={css.subLabel}>
                          <Typography variant="body2" color="text.secondary">
                            Part of the Free January, Safe Foundation&apos;s gas sponsorship program for USDe holders{' '}
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="body2" color="inherit">
                                    USDe holders enjoy gasless transactions on Ethereum Mainnet this January.{' '}
                                    <Typography component="span" fontWeight="bold">
                                      <Link
                                        href="https://help.safe.global/en/articles/484423-no-fee-january-campaign"
                                        style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
        {gasTooHigh && noFeeCampaign?.isEligible && (
          <div className={css.gasBannerWrapper}>
            <GasTooHighBannerLoader />
          </div>
        )}
      </div>

      {shouldRelay && noFeeCampaign?.isEligible ? (
        <Typography variant="body2" className={css.transactionCounter}>
          <span className={css.counterNumber}>{noFeeCampaign.remaining}</span> free transactions left
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
