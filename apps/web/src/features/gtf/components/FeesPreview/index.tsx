import type { ReactElement, ReactNode } from 'react'
import { useContext, useRef, useState } from 'react'
import { Alert, Divider, MenuItem, Popover, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ArrowUpRightIcon from '@/public/images/common/arrow-up-right.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import TokenIcon from '@/components/common/TokenIcon'
import { useCurrentChain } from '@/hooks/useChains'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { GtfPaymentMode } from '@/features/gtf/types'
import type { FeesPreviewData, FeeRow as FeeRowType, TotalOutgoing } from '../../hooks/useFeesPreview'
import css from './styles.module.css'

const EXECUTION_FEE_TOOLTIP =
  'Covers third-party services required to securely execute this transaction. Based on the transaction amount. Currently free while the new model is introduced.'
const GAS_FEE_TOOLTIP = 'Network cost required to process this transaction on the blockchain.'
const SIGNER_FEE_TOOLTIP = 'Fees will be paid from the connected signer wallet when executing this transaction.'
const HOW_FEES_WORK_URL = 'https://help.safe.global/en/articles/618701-safe-wallet-gas-fees-faq'

const FeeRow = ({
  label,
  amount,
  currency,
  fiatAmount,
  isFree,
  note,
  loading,
  error,
  tooltip,
}: FeeRowType & { loading?: boolean; error?: boolean; tooltip?: ReactNode }): ReactElement => (
  <div className={css.feeRow}>
    <div className={css.feeLabel}>
      <Typography variant="body2">{label}</Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow>
          <span className={css.tooltipIcon}>
            <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
          </span>
        </Tooltip>
      )}
    </div>

    <div className={css.feeValue}>
      {loading ? (
        <Skeleton variant="text" sx={{ minWidth: '7em' }} />
      ) : error ? (
        <Typography variant="body2" color="warning.main">
          Cannot estimate
        </Typography>
      ) : note ? (
        <Typography variant="body2" color="text.secondary">
          {note}
        </Typography>
      ) : (
        <>
          <div className={css.feeAmount}>
            {isFree && (
              <Typography variant="body2" component="span" color="success.main" fontWeight={700}>
                FREE
              </Typography>
            )}
            {amount && (
              <Typography variant="body2" component="span" className={isFree ? css.strikethrough : undefined}>
                {amount} {currency}
              </Typography>
            )}
          </div>
          {fiatAmount && (
            <Typography variant="caption" color="text.secondary">
              {fiatAmount}
            </Typography>
          )}
        </>
      )}
    </div>
  </div>
)

const TotalOutgoingSection = ({ totalOutgoing }: { totalOutgoing: TotalOutgoing }): ReactElement => (
  <div className={css.totalOutgoing}>
    <Typography variant="body2" fontWeight={700}>
      Total outgoing
    </Typography>
    <div className={css.totalOutgoingValue}>
      <Typography variant="body2" fontWeight={700}>
        {totalOutgoing.primary.amount} {totalOutgoing.primary.currency}
      </Typography>
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
        role="button"
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
        slotProps={{ paper: { className: css.selectorPopoverPaper } }}
      >
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
      </Popover>
    </>
  )
}

const GasTokenSelector = ({
  availableGasTokens,
  selectedGasToken,
  onGasTokenChange,
  locked,
}: {
  availableGasTokens: FeesPreviewData['availableGasTokens']
  selectedGasToken: string
  onGasTokenChange?: (address: string) => void
  locked?: boolean
}): ReactElement => {
  // EVM addresses are case-insensitive; strict `===` would silently fall back to [0] when the
  // stored address and the candidate address differ in checksum casing.
  const selected = availableGasTokens?.find((t) => sameAddress(t.address, selectedGasToken)) ?? availableGasTokens?.[0]
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
        role={locked ? undefined : 'button'}
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
        slotProps={{ paper: { className: css.selectorPopoverPaper } }}
      >
        {availableGasTokens?.map((token) => (
          <MenuItem
            key={token.address}
            selected={sameAddress(token.address, selectedGasToken)}
            onClick={() => handleSelect(token.address)}
            className={`${css.selectorMenuItem} ${css.gasTokenMenuItem}`}
          >
            <TokenIcon logoUri={token.logoUri} tokenSymbol={token.symbol} size={24} />
            <div>
              <Typography variant="body2" fontWeight={700}>
                {token.symbol}
              </Typography>
              {token.fiatBalance && (
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(token.fiatBalance, 'usd')}
                </Typography>
              )}
            </div>
          </MenuItem>
        ))}
      </Popover>
    </>
  )
}

const SignerFeeNotice = ({
  availableGasTokens,
}: {
  availableGasTokens: FeesPreviewData['availableGasTokens']
}): ReactElement => {
  const chain = useCurrentChain()
  // Fall back to the chain's native currency when no candidate is available — happens when
  // the CGW fees endpoint errors out (e.g. 429) and every probe rejects. Signer always pays
  // in the chain's native gas, so the chain config is the correct deterministic fallback.
  const nativeToken = availableGasTokens?.[0] ?? {
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
      <Typography variant="body2" color="text.secondary">
        Fees can&apos;t currently be paid from your Safe.
      </Typography>
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

  const isSafeWallet = gtfPaymentMode === 'safe'
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
        <a href={HOW_FEES_WORK_URL} target="_blank" rel="noreferrer" className={css.howFeesWork}>
          How fees work
          <SvgIcon component={ArrowUpRightIcon} inheritViewBox sx={{ fontSize: '16px' }} />
        </a>
      </div>

      <div className={css.feeCard}>
        {/* Confirmer on a Safe-pays signed payload — fees already locked in */}
        {isConfirmation && canCoverFees && !isLegacySigned && (
          <>
            <ConfirmationFeeNotice availableGasTokens={availableGasTokens} selectedGasToken={selectedGasToken} />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* Confirmer on a non-Safe-pays signed payload — pay from signer, also locked */}
        {isLegacySigned && (
          <>
            <SignerFeeNotice availableGasTokens={availableGasTokens} />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* First signer, Safe can cover fees */}
        {!isConfirmation && canCoverFees && (
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
                />
              </div>
            </div>

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* Safe can't cover fees — fall back to signer */}
        {!canCoverFees && (
          <>
            <SignerFeeNotice availableGasTokens={availableGasTokens} />

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        <FeeRow {...executionFee} loading={props.loading} tooltip={EXECUTION_FEE_TOOLTIP} />
        <FeeRow {...gasFee} loading={props.loading} error={props.error} tooltip={GAS_FEE_TOOLTIP} />
      </div>

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

      {displayedOutgoing && <TotalOutgoingSection totalOutgoing={displayedOutgoing} />}
    </div>
  )
}

export default FeesPreview
