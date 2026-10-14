import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { AppRoutes } from '@/config/routes'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Separator } from '@safe-global/views/components/ui/separator'
import WalletIcon from '@safe-global/views/components/common/WalletIcon'
import TokenIcon from '@/components/common/TokenIcon'
import BalanceInfo from '@/components/tx/BalanceInfo'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
import { ExecutionMethod, SponsoredRadio, SponsoredStrip } from '@/components/tx/ExecutionMethodSelector'
import useWallet from '@/hooks/wallets/useWallet'
import { useCurrentChain } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import type { SponsoredOffer } from '@/utils/gasPayment'
import type { GasPayerChoice } from '../../types'
import type { GasPayerSelection } from '../../hooks/useGasPayerSelection'
import { GasTokenSelector, TotalOutgoingSection } from '../FeesPreview'
import { FeeBreakdownRow } from '@safe-global/views/features/gtf/components/shared/FeeBreakdownRow'
import { GAS_FEE_TOOLTIP } from '@safe-global/views/features/gtf/components/shared/tooltips'
import css from './styles.module.css'

const SAFE_LOGO = '/images/logo-no-text.svg'

/** Radio values: the sponsored one is `ExecutionMethod.RELAY` so `SponsoredRadio` can be reused as is. */
const toRadioValue = (choice: GasPayerChoice): string => (choice === 'SPONSORED' ? ExecutionMethod.RELAY : choice)
const fromRadioValue = (value: unknown): GasPayerChoice =>
  value === ExecutionMethod.RELAY ? 'SPONSORED' : (value as GasPayerChoice)

const PayFromSafeRadio = ({ locked }: { locked: boolean }): ReactElement => (
  <Label
    data-testid="pay-from-safe-execution-method"
    className={locked ? 'flex flex-1 items-center gap-2' : 'flex flex-1 cursor-pointer items-center gap-2'}
  >
    <RadioGroupItem value="PAY_FROM_SAFE" disabled={locked} />
    <Typography className={css.radioLabel}>
      <img src={SAFE_LOGO} alt="Safe" className={css.safeLogo} /> Pay from Safe
    </Typography>
  </Label>
)

/** The option as a Safe Pro upsell: visible, not selectable. */
const PayFromSafeUpsellRadio = (): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Label data-testid="pay-from-safe-upsell" className="flex flex-1 cursor-not-allowed items-center gap-2">
          <RadioGroupItem value="PAY_FROM_SAFE" disabled />
          <Typography className={`${css.radioLabel} text-muted-foreground`}>
            <img src={SAFE_LOGO} alt="Safe" className={css.safeLogo} /> Pay from Safe
            <span className="block h-4 w-6" role="img" aria-label="Safe Pro">
              <ProChip className="size-full" />
            </span>
          </Typography>
        </Label>
      }
    />
    <TooltipContent>Paying gas fees from the Safe account is included in Safe Pro.</TooltipContent>
  </Tooltip>
)

const PayFromSafeUpsellStrip = (): ReactElement => (
  <div className={css.upsell} data-testid="pay-from-safe-upsell-strip">
    <Typography variant="paragraph-small">Pay gas fees from your Safe account with Safe Pro</Typography>
    <Button variant="outline" size="xs" render={<NextLink href={AppRoutes.welcome.spaces} />}>
      Upgrade to
      <span className="block h-4 w-6" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
    </Button>
  </div>
)

/** The fee details of paying from the Safe: token, max gas fee, total outgoing, balance warning. */
const PayFromSafeDetails = ({ fees, locked }: { fees: GasPayerSelection['fees']; locked: boolean }): ReactElement => {
  const { availableGasTokens, selectedGasToken, gasFee, totalOutgoing, safeHasEnoughGas } = fees
  const token =
    availableGasTokens?.find((t) => sameAddress(t.address, selectedGasToken ?? '')) ?? availableGasTokens?.[0]

  return (
    <div className={css.details} data-testid="pay-from-safe-details">
      {locked ? (
        <div className={css.tokenRow}>
          <Typography variant="paragraph-small-bold">Fees are paid from the Safe using</Typography>
          <TokenIcon logoUri={token?.logoUri} tokenSymbol={token?.symbol} size={24} />
          <Typography variant="paragraph-small-bold">{token?.symbol}</Typography>
        </div>
      ) : (
        <div className={css.tokenRow}>
          <Typography variant="paragraph-small" color="muted">
            Fees token:
          </Typography>
          <GasTokenSelector
            availableGasTokens={availableGasTokens}
            selectedGasToken={selectedGasToken ?? ''}
            onGasTokenChange={fees.onGasTokenChange}
          />
        </div>
      )}

      <Separator bleed="4" />

      <FeeBreakdownRow {...gasFee} loading={fees.loading} error={fees.error} tooltip={GAS_FEE_TOOLTIP} />

      {totalOutgoing && <TotalOutgoingSection totalOutgoing={totalOutgoing} />}

      {safeHasEnoughGas === false && !fees.loading && (
        <Alert variant="warning" outlined={false} className="mt-2">
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>
            Insufficient {gasFee.currency} balance to cover the gas fee. Top up before execution, otherwise the
            transaction will fail.
          </AlertDescription>
        </Alert>
      )}

      {locked && (
        <Typography variant="paragraph-small" color="muted" className="mt-2">
          The fee was fixed when this transaction was signed. It is relayed and the Safe refunds the relayer on-chain,
          so it can&apos;t be sponsored or executed from a connected wallet.
        </Typography>
      )}
    </div>
  )
}

/**
 * Who pays the gas: a sponsor (plan, daily limit, campaign), the Safe itself, or the connected wallet.
 * One selector for the three, replacing the sponsored/wallet one and the standalone fee card.
 */
const GasPayerSelector = ({
  offer,
  showsProUpsell,
  selection,
}: {
  offer: SponsoredOffer | null
  /** No sponsored option is left, but a Safe Pro plan would sponsor this Safe. */
  showsProUpsell?: boolean
  selection: GasPayerSelection
}): ReactElement | null => {
  const wallet = useWallet()
  const chain = useCurrentChain()
  const isSafeProEnabled = useIsSafeProEnabled()
  const { choice, setChoice, isLocked, canPayFromSafe, mustUpgradeToPayFromSafe, fees } = selection

  const showsPayFromSafe = isLocked || canPayFromSafe
  if (!offer && !showsPayFromSafe && !mustUpgradeToPayFromSafe && !showsProUpsell) return null

  return (
    <div className={css.container} data-testid="gas-payer-selector">
      <div className={css.method}>
        <Typography variant="paragraph-small" className={css.label}>
          Who will pay gas fees
        </Typography>

        <RadioGroup
          value={toRadioValue(choice)}
          onValueChange={(value) => setChoice(fromRadioValue(value))}
          className={css.radioGroup}
        >
          {!isLocked && offer && <SponsoredRadio offer={offer} chainId={chain?.chainId ?? ''} />}

          {showsPayFromSafe && <PayFromSafeRadio locked={isLocked} />}
          {mustUpgradeToPayFromSafe && <PayFromSafeUpsellRadio />}

          {!isLocked && (
            <Label
              data-testid="connected-wallet-execution-method"
              className="flex flex-1 cursor-pointer items-center gap-2"
            >
              <RadioGroupItem value="WALLET" />
              <Typography className={css.radioLabel}>
                <WalletIcon provider={wallet?.label || ''} width={20} height={20} icon={wallet?.icon} /> Connected
                wallet
              </Typography>
            </Label>
          )}
        </RadioGroup>
      </div>

      {choice === 'PAY_FROM_SAFE' ? (
        <PayFromSafeDetails fees={fees} locked={isLocked} />
      ) : offer ? (
        <SponsoredStrip
          offer={offer}
          isRelay={choice === 'SPONSORED'}
          isSafeProEnabled={isSafeProEnabled}
          hasWallet={!!wallet}
        />
      ) : showsProUpsell ? (
        <SponsoredTxsCounter left={0} quota={null} resetsAt={null} isSubscription={false} isPro={false} />
      ) : mustUpgradeToPayFromSafe ? (
        <PayFromSafeUpsellStrip />
      ) : wallet ? (
        <BalanceInfo />
      ) : null}
    </div>
  )
}

export default GasPayerSelector
