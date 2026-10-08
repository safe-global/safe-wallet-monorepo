import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Chip } from '@/components/ui/chip'
import { Link } from '@/components/ui/link'
import type { ReactElement, ReactNode } from 'react'
import WalletIcon from '@/components/common/WalletIcon'
import { Info } from 'lucide-react'
import type { SponsoredOffer } from '@/utils/gasPayment'

import css from './styles.module.css'

const RELAY = 'RELAY'
const WALLET = 'WALLET'

const CampaignLabel = ({ offer }: { offer: Extract<SponsoredOffer, { option: 'NO_FEE_CAMPAIGN' }> }) => {
  if (offer.disabledReason) {
    return (
      <div className={css.noFeeCampaignLabel}>
        <Chip size="sm" shape="tag">
          {offer.disabledReason === 'LIMIT_REACHED' ? `${offer.remaining}/${offer.limit} available` : 'Not available'}
        </Chip>
        <Typography className={css.notAvailableTitle}>Sponsored gas</Typography>
        <div className={css.descriptionWrapper}>
          <Typography className={css.descriptionText}>
            Part of the Free January, Safe Foundation&apos;s gas sponsorship program for USDe holders
          </Typography>
        </div>
      </div>
    )
  }

  return (
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
  )
}

const SponsoredRadioLabel = ({ offer, sponsoredBy }: { offer: SponsoredOffer; sponsoredBy: ReactNode }) =>
  offer.option === 'NO_FEE_CAMPAIGN' ? (
    <CampaignLabel offer={offer} />
  ) : (
    <Typography className={`${css.radioLabel} whitespace-nowrap`}>
      Sponsored by
      {sponsoredBy}
    </Typography>
  )

const SponsoredRadio = ({ offer, sponsoredBy }: { offer: SponsoredOffer; sponsoredBy: ReactNode }) => {
  if (!offer.disabledReason) {
    return (
      <Label data-testid="relay-execution-method" className="flex flex-1 cursor-pointer items-center gap-2">
        <RadioGroupItem value={RELAY} />
        <SponsoredRadioLabel offer={offer} sponsoredBy={sponsoredBy} />
      </Label>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Label
            data-testid="relay-execution-method"
            className="flex flex-1 cursor-not-allowed items-center gap-[10px]"
          >
            <RadioGroupItem value={RELAY} disabled />
            <SponsoredRadioLabel offer={offer} sponsoredBy={sponsoredBy} />
          </Label>
        }
      />
      <TooltipContent>
        {offer.disabledReason === 'GAS_TOO_HIGH'
          ? 'Gas prices are too high right now'
          : 'You reached the limit of sponsored transactions.'}
      </TooltipContent>
    </Tooltip>
  )
}

export const NoFeeCampaignCounterView = ({ remaining }: { remaining: number }): ReactElement => (
  <Typography variant="paragraph-small" className={css.transactionCounter}>
    <span className={css.counterNumber}>{remaining}</span> free transactions left
  </Typography>
)

export const ExecutionMethodUpsellView = ({ counter }: { counter: ReactNode }): ReactElement => (
  <div className={`${css.container} overflow-hidden rounded-[var(--radius)]`}>{counter}</div>
)

export type ExecutionMethodSelectorViewProps = {
  offer: SponsoredOffer
  wallet: { label?: string; icon?: string } | null
  selectedMethod: string
  onChooseExecutionMethod: (newExecutionMethod: unknown) => void
  noLabel?: boolean
  sponsoredBy: ReactNode
  gasTooHighBanner: ReactNode
  strip: ReactNode
}

export const ExecutionMethodSelectorView = ({
  offer,
  wallet,
  selectedMethod,
  onChooseExecutionMethod,
  noLabel,
  sponsoredBy,
  gasTooHighBanner,
  strip,
}: ExecutionMethodSelectorViewProps): ReactElement => {
  return (
    /* overflow-hidden clips the relay counter's 6px bottom corners to this radius */
    <div className={`${css.container} overflow-hidden rounded-[var(--radius)]`}>
      <div className={css.method}>
        <div className="flex flex-col">
          {!noLabel ? (
            <Typography variant="paragraph-small" className={css.label}>
              Who will pay gas fees
            </Typography>
          ) : null}

          <RadioGroup
            value={selectedMethod}
            onValueChange={onChooseExecutionMethod}
            className={`${css.radioGroup} flex flex-row`}
          >
            <SponsoredRadio offer={offer} sponsoredBy={sponsoredBy} />

            <Label
              data-testid="connected-wallet-execution-method"
              className="flex flex-1 cursor-pointer items-center gap-2"
            >
              <RadioGroupItem value={WALLET} />
              <Typography className={css.radioLabel}>
                <WalletIcon provider={wallet?.label || ''} width={20} height={20} icon={wallet?.icon} /> Connected
                wallet
              </Typography>
            </Label>
          </RadioGroup>
        </div>

        {offer.option === 'NO_FEE_CAMPAIGN' && offer.disabledReason === 'GAS_TOO_HIGH' && (
          <div className={css.gasBannerWrapper}>{gasTooHighBanner}</div>
        )}
      </div>

      {strip}
    </div>
  )
}
