import type { KeyboardEvent, ReactElement } from 'react'
import { useContext, useRef, useState } from 'react'
import { Alert, Divider, MenuItem, Popover, SvgIcon, Tooltip, Typography } from '@mui/material'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import InfoIcon from '@/public/images/notifications/info.svg'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import TokenIcon from '@/components/common/TokenIcon'
import PlanStatusChip from '../PlanStatusChip'
import { usePlanStatus } from '../PlanStatusChip/usePlanStatus'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { GtfPaymentMode } from '@/features/gtf/types'
import type { FeesPreviewData, TotalOutgoing } from '../../hooks/useFeesPreview'
import { FeeBreakdownRow } from '../shared/FeeBreakdownRow'
import { GAS_FEE_TOOLTIP } from '../shared/tooltips'
import css from './styles.module.css'

const SIGNER_FEE_TOOLTIP = 'Fees will be paid from the connected signer wallet when executing this transaction.'

// Enable not regular selectors to open the dropdowns for accessibility and keyboard users.
const onActivateKey = (open: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    open()
  }
}
const TotalOutgoingSection = ({ totalOutgoing }: { totalOutgoing: TotalOutgoing }): ReactElement => (
  <div className={css.totalOutgoing}>
    <Typography variant="body2" fontWeight={700}>
      Total outgoing
    </Typography>
    <div className={css.totalOutgoingValue}>
      {totalOutgoing.primary.map((line) => (
        <Typography key={line.currency} variant="body2" fontWeight={700}>
          {line.amount} {line.currency}
        </Typography>
      ))}
      {totalOutgoing.fees && (
        <Typography variant="body2" fontWeight={700}>
          {totalOutgoing.fees.amount} {totalOutgoing.fees.currency}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {totalOutgoing.fiatTotal}
      </Typography>
    </div>
  </div>
)

const PAYMENT_SOURCES = ['safe', 'signer'] as const satisfies readonly GtfPaymentMode[]

const paymentSourceLabel = (source: GtfPaymentMode) => (source === 'safe' ? 'Safe' : 'Signer')

const SelectorCaret = ({ open }: { open: boolean }): ReactElement => (
  <CaretDownIcon className={`${css.selectorCaret} ${open ? css.selectorCaretOpen : ''}`} />
)

const PaymentSourceSelector = ({
  value,
  onChange,
}: {
  value: GtfPaymentMode
  onChange: (source: GtfPaymentMode) => void
}): ReactElement => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleSelect = (source: GtfPaymentMode) => {
    onChange(source)
    setOpen(false)
  }

  return (
    <>
      <div
        ref={anchorRef}
        className={css.paymentSourceSelector}
        onClick={() => setOpen(true)}
        onKeyDown={onActivateKey(() => setOpen(true))}
        role="button"
        tabIndex={0}
        data-testid="payment-source-selector"
      >
        <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
          {paymentSourceLabel(value)}
        </Typography>
        <SelectorCaret open={open} />
      </div>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: { className: `${css.selectorPopoverPaper} ${css.selectorPopoverPaperPayment}` },
        }}
      >
        <div className={css.selectorPopoverInner}>
          {PAYMENT_SOURCES.map((source) => (
            <MenuItem
              key={source}
              selected={source === value}
              onClick={() => handleSelect(source)}
              className={css.selectorMenuItem}
            >
              <Typography variant="body2" fontWeight={700}>
                {paymentSourceLabel(source)}
              </Typography>
            </MenuItem>
          ))}
        </div>
      </Popover>
    </>
  )
}

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
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleSelect = (address: string) => {
    onGasTokenChange?.(address)
    setOpen(false)
  }

  return (
    <>
      <div
        ref={anchorRef}
        className={`${css.gasTokenSelector} ${locked ? css.gasTokenSelectorLocked : ''}`}
        onClick={locked ? undefined : () => setOpen(true)}
        onKeyDown={locked ? undefined : onActivateKey(() => setOpen(true))}
        role={locked ? undefined : 'button'}
        tabIndex={locked ? undefined : 0}
        data-testid="gas-token-selector"
      >
        <TokenIcon logoUri={selected?.logoUri} tokenSymbol={selected?.symbol} size={24} />
        <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
          {selected?.symbol}
        </Typography>
        {locked ? (
          <Tooltip title={SIGNER_FEE_TOOLTIP} placement="top" arrow>
            <span className={css.tooltipIcon}>
              <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
            </span>
          </Tooltip>
        ) : (
          <SelectorCaret open={open} />
        )}
      </div>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: { className: `${css.selectorPopoverPaper} ${css.selectorPopoverPaperGasToken}` },
        }}
      >
        <div className={`${css.selectorPopoverInner} ${css.selectorPopoverInnerGasToken}`}>
          {availableGasTokens?.map((token) => (
            <MenuItem
              key={token.address}
              selected={sameAddress(token.address, selectedGasToken)}
              onClick={() => handleSelect(token.address)}
              className={`${css.selectorMenuItem} ${css.gasTokenMenuItem}`}
            >
              <TokenIcon logoUri={token.logoUri} tokenSymbol={token.symbol} size={24} />
              <div className={css.gasTokenMenuItemText}>
                <Typography variant="body2" fontWeight={700}>
                  {token.symbol}
                </Typography>
                {token.fiatBalance && (
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(token.fiatBalance, currency)}
                  </Typography>
                )}
              </div>
            </MenuItem>
          ))}
        </div>
      </Popover>
    </>
  )
}

const SignerFeeNotice = ({ isLocked }: { isLocked?: boolean }): ReactElement => {
  const chain = useCurrentChain()
  const nativeToken = {
    symbol: chain?.nativeCurrency.symbol ?? '',
    logoUri: chain?.nativeCurrency.logoUri ?? '',
  }

  return (
    <div className={css.signerFeeNotice}>
      <div className={css.signerFeeNoticeRow}>
        <Typography variant="body2" fontWeight={700}>
          Fees will be paid from the signer using
        </Typography>
        <TokenIcon logoUri={nativeToken.logoUri} tokenSymbol={nativeToken.symbol} size={24} />
        <Typography variant="body2" fontWeight={700}>
          {nativeToken.symbol}
        </Typography>
        <Tooltip title={SIGNER_FEE_TOOLTIP} placement="top" arrow>
          <span className={css.tooltipIcon}>
            <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
          </span>
        </Tooltip>
      </div>
      {!isLocked && (
        <Typography variant="body2" color="text.secondary">
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
      <Typography variant="body2" fontWeight={700}>
        Fees will be paid from your Safe using
      </Typography>
      <TokenIcon logoUri={token?.logoUri} tokenSymbol={token?.symbol} size={24} />
      <Typography variant="body2" fontWeight={700}>
        {token?.symbol}
      </Typography>
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
  const planStatus = usePlanStatus()
  const chain = useCurrentChain()
  const nativeDisplay = {
    symbol: chain?.nativeCurrency.symbol ?? '',
    logoUri: chain?.nativeCurrency.logoUri ?? '',
  }

  // No eligible gas token in the Safe → Safe-pays isn't actually an option for this tx.
  // Lock the UI to signer-pays so the dropdown isn't shown empty and the user can't pick
  // "Safe" expecting it to work (PLA-1435). The hook already routes to signer-pays internally
  // (canCoverFees stays true), so we just override the rendering here.
  const noEligibleGasToken =
    !isConfirmation && !isLegacySigned && (availableGasTokens?.length ?? 0) === 0 && canCoverFees

  const isSafeWallet = gtfPaymentMode === 'safe' && !noEligibleGasToken
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
        <Typography variant="subtitle2" fontWeight={700}>
          Fees
        </Typography>
        <PlanStatusChip planStatus={planStatus} />
      </div>

      <div className={css.feeCard}>
        {/* Confirmer on a Safe-pays signed payload — fees already locked in */}
        {isConfirmation && canCoverFees && !isLegacySigned && (
          <>
            <ConfirmationFeeNotice availableGasTokens={availableGasTokens} selectedGasToken={selectedGasToken} />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* Confirmer on a non-Safe-pays signed payload — pay from signer, also locked.
            Same lock when the Safe holds no eligible gas token. */}
        {(isLegacySigned || noEligibleGasToken) && (
          <>
            <SignerFeeNotice isLocked />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* First signer, Safe can cover fees */}
        {!isConfirmation && canCoverFees && !noEligibleGasToken && (
          <>
            <div className={css.paymentRow}>
              <div className={css.paymentRowGroup}>
                <Typography variant="body2" color="text.secondary">
                  Pay fees from:
                </Typography>
                <PaymentSourceSelector value={gtfPaymentMode} onChange={handlePaymentSourceChange} />
              </div>
              <div className={css.paymentRowGroup}>
                <Typography variant="body2" color="text.secondary">
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

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* Safe can't cover fees — fall back to signer */}
        {!canCoverFees && (
          <>
            <SignerFeeNotice />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        <FeeBreakdownRow {...executionFee} loading={props.loading} />
        <FeeBreakdownRow {...gasFee} loading={props.loading} error={props.error} tooltip={GAS_FEE_TOOLTIP} />
      </div>

      {displayedOutgoing && <TotalOutgoingSection totalOutgoing={displayedOutgoing} />}

      {/* Safe-pays only — surfaced when the Safe doesn't currently hold enough of the chosen
          gas token to cover the on-chain fee. We don't block signing in case another signer or
          a top-up brings the balance up before execution; the simulation/execution will revert
          with GS013 if it doesn't. */}
      {safeHasEnoughGas === false && !props.loading && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Insufficient {gasFee.currency} balance to cover the gas fee. Top up before execution, otherwise the
          transaction will fail.
        </Alert>
      )}
    </div>
  )
}

export default FeesPreview
