import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Chip } from '@/components/ui/chip'
import { Link } from '@/components/ui/link'
import type { Dispatch, SetStateAction, ReactElement } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'

import RemainingRelays from '../RemainingRelays'
import { Info } from 'lucide-react'
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

  const onChooseExecutionMethod = (newExecutionMethod: unknown) => {
    setExecutionMethod(newExecutionMethod as ExecutionMethod)
  }

  return (
    <div className={`${css.container} rounded-[var(--radius)]`}>
      <div className={css.method}>
        <div className="flex flex-col">
          {!noLabel ? (
            <Typography variant="paragraph-small" className={css.label}>
              Who will pay gas fees:
            </Typography>
          ) : null}

          <RadioGroup
            value={executionMethod}
            onValueChange={onChooseExecutionMethod}
            className={`${css.radioGroup} flex flex-row`}
          >
            {(() => {
              const isLimitReached = noFeeCampaign?.isEligible && noFeeCampaign.remaining === 0
              const availabilityLabel = noFeeCampaign?.limit
                ? `${noFeeCampaign.remaining || 0}/${noFeeCampaign.limit} available`
                : ''
              const isDisabled = gasTooHigh || isLimitReached

              const relayValue = noFeeCampaign?.isEligible ? ExecutionMethod.NO_FEE_CAMPAIGN : ExecutionMethod.RELAY

              return isDisabled ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Label
                        data-testid="relay-execution-method"
                        className="flex flex-1 cursor-not-allowed items-center gap-[10px]"
                      >
                        <RadioGroupItem value={relayValue} disabled />
                        {noFeeCampaign?.isEligible ? (
                          <div className={css.noFeeCampaignLabel}>
                            <Chip className={css.notAvailableChip}>
                              {isLimitReached ? availabilityLabel : 'Not available'}
                            </Chip>
                            <Typography className={css.notAvailableTitle}>Sponsored gas</Typography>
                            <div className={css.descriptionWrapper}>
                              <Typography className={css.descriptionText}>
                                Part of the Free January, Safe Foundation&apos;s gas sponsorship program for USDe
                                holders
                              </Typography>
                            </div>
                          </div>
                        ) : (
                          <Typography className={`${css.radioLabel} whitespace-nowrap`}>
                            Sponsored by
                            <SponsoredBy chainId={chain?.chainId ?? ''} />
                          </Typography>
                        )}
                      </Label>
                    }
                  />
                  <TooltipContent>
                    {gasTooHigh
                      ? 'Gas prices are too high right now'
                      : 'You reached the limit of sponsored transactions.'}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Label data-testid="relay-execution-method" className="flex flex-1 cursor-pointer items-center gap-2">
                  <RadioGroupItem value={relayValue} />
                  {noFeeCampaign?.isEligible ? (
                    <div className={css.noFeeCampaignLabel}>
                      <Typography className={css.mainLabel}>Sponsored gas</Typography>
                      <div className={css.subLabel}>
                        <Typography variant="paragraph-small" className="text-muted-foreground">
                          Part of the Free January, Safe Foundation&apos;s gas sponsorship program for USDe holders{' '}
                          <Tooltip>
                            <TooltipTrigger render={<Info className={css.infoIconInline} />} />
                            <TooltipContent>
                              <span>
                                USDe holders enjoy gasless transactions on Ethereum Mainnet this January.{' '}
                                <Link
                                  href="https://help.safe.global/articles/9605526657-no-fee-january-campaign"
                                  className="font-bold underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="inherit"
                                >
                                  Learn more
                                </Link>
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        </Typography>
                      </div>
                    </div>
                  ) : (
                    <Typography className={`${css.radioLabel} whitespace-nowrap`}>
                      Sponsored by
                      <SponsoredBy chainId={chain?.chainId ?? ''} />
                    </Typography>
                  )}
                </Label>
              )
            })()}

            <Label
              data-testid="connected-wallet-execution-method"
              className="flex flex-1 cursor-pointer items-center gap-2"
            >
              <RadioGroupItem value={ExecutionMethod.WALLET} />
              <Typography className={css.radioLabel}>
                <WalletIcon provider={wallet?.label || ''} width={20} height={20} icon={wallet?.icon} /> Connected
                wallet
              </Typography>
            </Label>
          </RadioGroup>
        </div>

        {/* Gas too high banner - shown inside method section when gas is too high */}
        {gasTooHigh && noFeeCampaign?.isEligible && (
          <div className={css.gasBannerWrapper}>
            <GasTooHighBannerLoader />
          </div>
        )}
      </div>

      {shouldRelay && noFeeCampaign?.isEligible ? (
        <Typography variant="paragraph-small" className={css.transactionCounter}>
          <span className={css.counterNumber}>{noFeeCampaign.remaining}</span> free transactions left
        </Typography>
      ) : shouldRelay && relays ? (
        <RemainingRelays relays={relays} tooltip={tooltip} />
      ) : wallet ? (
        <BalanceInfo />
      ) : null}
    </div>
  )
}

export const ExecutionMethodSelector = madProps(_ExecutionMethodSelector, {
  wallet: useWallet,
  chain: useCurrentChain,
})
