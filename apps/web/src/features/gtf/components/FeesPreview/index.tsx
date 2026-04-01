import type { ReactElement, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { Alert, Divider, IconButton, MenuItem, Popover, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OutgoingIcon from '@/public/images/transactions/outgoing.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { FeesPreviewData, FeeRow as FeeRowType, TotalOutgoing } from '../../hooks/useFeesPreview'
import css from './styles.module.css'

const EXECUTION_FEE_TOOLTIP =
  'Covers third-party services required to securely execute this transaction. Based on the transaction amount. Currently free while the new model is introduced.'
const GAS_FEE_TOOLTIP = 'Network cost required to process this transaction on the blockchain.'
const HOW_FEES_WORK_URL = 'https://help.safe.global/en/articles/618701-safe-wallet-gas-fees-faq'

type PaymentSource = 'safe' | 'signer'

const FeeRow = ({
  label,
  amount,
  currency,
  fiatAmount,
  isFree,
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
      ) : (
        <>
          <div className={css.feeAmount}>
            {isFree && (
              <Typography variant="body2" component="span" color="success.main" fontWeight={700} mr={1}>
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
        <Typography variant="body2">
          {totalOutgoing.fees.amount} {totalOutgoing.fees.currency}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {totalOutgoing.fiatTotal}
      </Typography>
    </div>
  </div>
)

const PaymentSourceToggle = ({
  value,
  onChange,
}: {
  value: PaymentSource
  onChange: (source: PaymentSource) => void
}): ReactElement => (
  <div className={css.toggle}>
    <button
      type="button"
      className={`${css.toggleTab} ${value === 'safe' ? css.toggleTabActive : ''}`}
      onClick={() => onChange('safe')}
    >
      Safe wallet
    </button>
    <button
      type="button"
      className={`${css.toggleTab} ${value === 'signer' ? css.toggleTabActive : ''}`}
      onClick={() => onChange('signer')}
    >
      Signing wallet
    </button>
  </div>
)

const GasTokenSelector = ({
  availableGasTokens,
  selectedGasToken,
  onGasTokenChange,
  locked,
}: {
  availableGasTokens: FeesPreviewData['availableGasTokens']
  selectedGasToken: string
  onGasTokenChange?: (symbol: string) => void
  locked?: boolean
}): ReactElement => {
  const selected = availableGasTokens?.find((t) => t.symbol === selectedGasToken) ?? availableGasTokens?.[0]
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleSelect = (symbol: string) => {
    onGasTokenChange?.(symbol)
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
        {selected?.logoUri && (
          <img src={selected.logoUri} alt={selected.symbol} width={24} height={24} className={css.tokenLogo} />
        )}
        <Typography variant="body2" fontWeight={700} letterSpacing="0.1px">
          {selected?.symbol}
        </Typography>
        {!locked && (
          <SvgIcon sx={{ fontSize: '16px', color: 'text.secondary' }}>
            <path d="M7 10l5 5 5-5H7z" />
          </SvgIcon>
        )}
      </div>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 140, borderRadius: '8px' } } }}
      >
        {availableGasTokens?.map((token) => (
          <MenuItem
            key={token.symbol}
            selected={token.symbol === selectedGasToken}
            onClick={() => handleSelect(token.symbol)}
            className={css.gasTokenMenuItem}
          >
            {token.logoUri && (
              <img src={token.logoUri} alt={token.symbol} width={24} height={24} className={css.tokenLogo} />
            )}
            <div>
              <Typography variant="body2" fontWeight={700}>
                {token.symbol}
              </Typography>
              {token.fiatBalance && (
                <Typography variant="caption" color="text.secondary">
                  {token.fiatBalance}
                </Typography>
              )}
            </div>
          </MenuItem>
        ))}
      </Popover>
    </>
  )
}

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { canCoverFees, executionFee, gasFee, totalOutgoing, availableGasTokens, selectedGasToken } = props
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('safe')
  const [fallbackDismissed, setFallbackDismissed] = useState(false)

  const isSafeWallet = paymentSource === 'safe'

  return (
    <div className={css.container}>
      {/* Header */}
      <div className={css.header}>
        <Typography variant="subtitle2" fontWeight={700}>
          Fees
        </Typography>
        <a href={HOW_FEES_WORK_URL} target="_blank" rel="noreferrer" className={css.howFeesWork}>
          How fees work
          <SvgIcon component={OutgoingIcon} inheritViewBox className={css.howFeesWorkIcon} sx={{ fontSize: '16px' }} />
        </a>
      </div>

      {/* Fee card */}
      <div className={css.feeCard}>
        {/* Payment source row — only when Safe can cover fees */}
        {canCoverFees && (
          <>
            <div className={css.paymentRow}>
              <Typography variant="body2">Pay fees from</Typography>
              <PaymentSourceToggle value={paymentSource} onChange={setPaymentSource} />
              <Typography variant="body2">using</Typography>
              <GasTokenSelector
                availableGasTokens={isSafeWallet ? availableGasTokens : availableGasTokens?.slice(0, 1)}
                selectedGasToken={isSafeWallet ? (selectedGasToken ?? '') : (availableGasTokens?.[0]?.symbol ?? '')}
                onGasTokenChange={props.onGasTokenChange}
                locked={!isSafeWallet}
              />
            </div>

            <Divider sx={{ mx: -2 }} />
          </>
        )}

        {/* Fee breakdown */}
        <FeeRow {...executionFee} loading={props.loading} tooltip={EXECUTION_FEE_TOOLTIP} />
        <FeeRow {...gasFee} loading={props.loading} error={props.error} tooltip={GAS_FEE_TOOLTIP} />
      </div>

      {/* Fallback EOA banner — shown when fees were computed but Safe can't cover them */}
      {!canCoverFees && executionFee.amount && !fallbackDismissed && (
        <Alert
          severity="info"
          data-testid="fallback-eoa-banner"
          action={
            <IconButton size="small" onClick={() => setFallbackDismissed(true)} aria-label="Dismiss">
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          Fees can&apos;t currently be paid from your Safe balance. For this transaction, fees will be paid by the
          executing wallet instead.
        </Alert>
      )}

      {/* Total outgoing — only when Safe can cover fees */}
      {canCoverFees && totalOutgoing && <TotalOutgoingSection totalOutgoing={totalOutgoing} />}
    </div>
  )
}

export default FeesPreview
