import type { ReactElement } from 'react'
import { useContext } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ArrowUpRightIcon from '@/public/images/common/arrow-up-right.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import TokenIcon from '@/components/common/TokenIcon'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { GtfPaymentMode } from '@/features/gtf/types'
import type { FeesPreviewData, TotalOutgoing } from '../../hooks/useFeesPreview'
import { FeeBreakdownRow } from '../shared/FeeBreakdownRow'
import { GAS_FEE_TOOLTIP } from '../shared/tooltips'
import { IS_RELAYING_LIVE } from '../../constants'
import css from './styles.module.css'

const SIGNER_FEE_TOOLTIP = 'Fees will be paid from the connected signer wallet when executing this transaction.'

const HOW_FEES_WORK_URL = 'https://help.safe.global/articles/9993850744-safewallet-gas-fees-faq'

const PAYMENT_SOURCES = ['safe', 'signer'] as const satisfies readonly GtfPaymentMode[]

const paymentSourceLabel = (source: GtfPaymentMode) => (source === 'safe' ? 'Safe' : 'Signer')

const SignerFeeTooltip = (): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className={css.tooltipIcon} />}>
      <InfoIcon className="size-4 text-[var(--color-border-main)]" />
    </TooltipTrigger>
    <TooltipContent side="top">{SIGNER_FEE_TOOLTIP}</TooltipContent>
  </Tooltip>
)

const TotalOutgoingSection = ({ totalOutgoing }: { totalOutgoing: TotalOutgoing }): ReactElement => (
  <div className={css.totalOutgoing}>
    <Typography variant="paragraph-small-bold">Total outgoing</Typography>
    <div className={css.totalOutgoingValue}>
      {totalOutgoing.primary.map((line) => (
        <Typography key={line.currency} variant="paragraph-small-bold">
          {line.amount} {line.currency}
        </Typography>
      ))}
      {totalOutgoing.fees && (
        <Typography variant="paragraph-small-bold">
          {totalOutgoing.fees.amount} {totalOutgoing.fees.currency}
        </Typography>
      )}
      <Typography variant="paragraph-mini" color="muted">
        {totalOutgoing.fiatTotal}
      </Typography>
    </div>
  </div>
)

const PaymentSourceSelector = ({
  value,
  onChange,
}: {
  value: GtfPaymentMode
  onChange: (source: GtfPaymentMode) => void
}): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger
      data-testid="payment-source-selector"
      render={<div role="button" tabIndex={0} className={css.paymentSourceSelector} />}
    >
      <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
        {paymentSourceLabel(value)}
      </Typography>
      <ChevronDown className={css.selectorCaret} />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="center" className={css.selectorPopoverPaperPayment}>
      {PAYMENT_SOURCES.map((source) => (
        <DropdownMenuItem key={source} onClick={() => onChange(source)} className={css.selectorMenuItem}>
          <Typography variant="paragraph-small-bold">{paymentSourceLabel(source)}</Typography>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

const GasTokenSelector = ({
  availableGasTokens,
  selectedGasToken,
  onGasTokenChange,
  locked,
  forcedDisplay,
}: {
  availableGasTokens: FeesPreviewData['availableGasTokens']
  selectedGasToken: string
  onGasTokenChange?: (address: string) => void
  locked?: boolean
  forcedDisplay?: { symbol: string; logoUri: string }
}): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  // EVM addresses are case-insensitive; strict `===` would silently fall back to [0] when the
  // stored address and the candidate address differ in checksum casing.
  const selected =
    forcedDisplay ??
    availableGasTokens?.find((t) => sameAddress(t.address, selectedGasToken)) ??
    availableGasTokens?.[0]

  const display = (
    <>
      <TokenIcon logoUri={selected?.logoUri} tokenSymbol={selected?.symbol} size={24} />
      <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
        {selected?.symbol}
      </Typography>
    </>
  )

  // Locked shows the same row with no trigger: signer-pays always uses the native token, so there
  // is nothing to choose and an interactive control would imply otherwise.
  if (locked) {
    return (
      <div className={cn(css.gasTokenSelector, css.gasTokenSelectorLocked)} data-testid="gas-token-selector">
        {display}
        <SignerFeeTooltip />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="gas-token-selector"
        render={<div role="button" tabIndex={0} className={css.gasTokenSelector} />}
      >
        {display}
        <ChevronDown className={css.selectorCaret} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className={css.selectorPopoverPaperGasToken}>
        {availableGasTokens?.map((token) => (
          <DropdownMenuItem
            key={token.address}
            onClick={() => onGasTokenChange?.(token.address)}
            className={cn(css.selectorMenuItem, css.gasTokenMenuItem)}
          >
            <TokenIcon logoUri={token.logoUri} tokenSymbol={token.symbol} size={24} />
            <div className={css.gasTokenMenuItemText}>
              <Typography variant="paragraph-small-bold">{token.symbol}</Typography>
              {token.fiatBalance && (
                <Typography variant="paragraph-mini" color="muted">
                  {formatCurrency(token.fiatBalance, currency)}
                </Typography>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SignerFeeNotice = ({ isLocked }: { isLocked?: boolean }): ReactElement => {
  const chain = useCurrentChain()

  return (
    <div className={css.signerFeeNotice}>
      <div className={css.signerFeeNoticeRow}>
        <Typography variant="paragraph-small-bold">Fees will be paid from the signer using</Typography>
        <TokenIcon logoUri={chain?.nativeCurrency.logoUri} tokenSymbol={chain?.nativeCurrency.symbol} size={24} />
        <Typography variant="paragraph-small-bold">{chain?.nativeCurrency.symbol}</Typography>
        <SignerFeeTooltip />
      </div>
      {!isLocked && (
        <Typography variant="paragraph-small" color="muted">
          Fees can&apos;t currently be paid from your Safe.
        </Typography>
      )}
    </div>
  )
}

const ConfirmationFeeNotice = ({
  availableGasTokens,
  selectedGasToken,
}: {
  availableGasTokens: FeesPreviewData['availableGasTokens']
  selectedGasToken?: string
}): ReactElement => {
  const token =
    availableGasTokens?.find((t) => sameAddress(t.address, selectedGasToken ?? '')) ?? availableGasTokens?.[0]

  return (
    <div className={css.signerFeeNoticeRow}>
      <Typography variant="paragraph-small-bold">Fees will be paid from your Safe using</Typography>
      <TokenIcon logoUri={token?.logoUri} tokenSymbol={token?.symbol} size={24} />
      <Typography variant="paragraph-small-bold">{token?.symbol}</Typography>
    </div>
  )
}

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const {
    canCoverFees,
    isConfirmation,
    isLegacySigned,
    executionFee,
    gasFee,
    totalOutgoing,
    availableGasTokens,
    selectedGasToken,
    safeHasEnoughGas,
  } = props
  const { gtfPaymentMode, setGtfPaymentMode } = useContext(SafeTxContext)
  const chain = useCurrentChain()
  const nativeDisplay = {
    symbol: chain?.nativeCurrency.symbol ?? '',
    logoUri: chain?.nativeCurrency.logoUri ?? '',
  }

  // No eligible gas token in the Safe → Safe-pays isn't actually an option for this tx. Lock the UI
  // to signer-pays so the dropdown isn't shown empty and the user can't pick "Safe" expecting it to
  // work (PLA-1435). The hook already routes to signer-pays internally (canCoverFees stays true), so
  // this only overrides the rendering.
  const noEligibleGasToken =
    !isConfirmation && !isLegacySigned && (availableGasTokens?.length ?? 0) === 0 && canCoverFees

  // Relaying hidden: only a payload signed before the switch still pays from the Safe.
  const isSafeWallet =
    (IS_RELAYING_LIVE ? gtfPaymentMode === 'safe' : !!isConfirmation && !isLegacySigned && canCoverFees) &&
    !noEligibleGasToken
  const displayedOutgoing = totalOutgoing && !isSafeWallet ? { ...totalOutgoing, fees: undefined } : totalOutgoing

  const handlePaymentSourceChange = (source: GtfPaymentMode) => {
    setGtfPaymentMode(source)
    if (source === 'signer') {
      const nativeAddress = availableGasTokens?.[0]?.address
      if (nativeAddress) props.onGasTokenChange?.(nativeAddress)
    }
  }

  return (
    <div className={css.container}>
      <div className={css.header}>
        <Typography variant="paragraph-small-bold">Fees</Typography>
        <a href={HOW_FEES_WORK_URL} target="_blank" rel="noreferrer noopener" className={css.howFeesWork}>
          How fees work
          <ArrowUpRightIcon className="size-4" />
        </a>
      </div>

      <div className={css.feeCard}>
        {/* Confirmer on a Safe-pays signed payload — fees already locked in */}
        {isConfirmation && canCoverFees && !isLegacySigned && (
          <>
            <ConfirmationFeeNotice availableGasTokens={availableGasTokens} selectedGasToken={selectedGasToken} />
            <Separator className="-mx-4 w-auto" />
          </>
        )}

        {/* Confirmer on a non-Safe-pays signed payload — pay from signer, also locked. Same lock
            when the Safe holds no eligible gas token. */}
        {(isLegacySigned || noEligibleGasToken) && (
          <>
            <SignerFeeNotice isLocked />
            <Separator className="-mx-4 w-auto" />
          </>
        )}

        {/* First signer, Safe can cover fees */}
        {!isConfirmation && canCoverFees && !noEligibleGasToken && (
          <>
            <div className={css.paymentRow}>
              <div className={css.paymentRowGroup}>
                <Typography variant="paragraph-small" color="muted">
                  Pay fees from:
                </Typography>
                <PaymentSourceSelector value={gtfPaymentMode} onChange={handlePaymentSourceChange} />
              </div>
              <div className={css.paymentRowGroup}>
                <Typography variant="paragraph-small" color="muted">
                  Fees token:
                </Typography>
                <GasTokenSelector
                  availableGasTokens={availableGasTokens}
                  selectedGasToken={isSafeWallet ? (selectedGasToken ?? '') : (availableGasTokens?.[0]?.address ?? '')}
                  onGasTokenChange={props.onGasTokenChange}
                  locked={!isSafeWallet}
                  forcedDisplay={!isSafeWallet ? nativeDisplay : undefined}
                />
              </div>
            </div>

            <Separator className="-mx-4 w-auto" />
          </>
        )}

        {/* Safe can't cover fees — fall back to signer */}
        {!canCoverFees && (
          <>
            <SignerFeeNotice />
            <Separator className="-mx-4 w-auto" />
          </>
        )}

        <FeeBreakdownRow {...executionFee} loading={props.loading} />
        <FeeBreakdownRow {...gasFee} loading={props.loading} error={props.error} tooltip={GAS_FEE_TOOLTIP} />
      </div>

      {displayedOutgoing && <TotalOutgoingSection totalOutgoing={displayedOutgoing} />}

      {/* Safe-pays only — surfaced when the Safe doesn't currently hold enough of the chosen gas
          token to cover the on-chain fee. Signing isn't blocked, since another signer or a top-up
          may bring the balance up before execution; otherwise execution reverts with GS013. */}
      {safeHasEnoughGas === false && !props.loading && (
        <Alert variant="warning" className="mt-2">
          <AlertDescription>
            Insufficient {gasFee.currency} balance to cover the gas fee. Top up before execution, otherwise the
            transaction will fail.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default FeesPreview
