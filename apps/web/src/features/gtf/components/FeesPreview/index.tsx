import type { ReactElement, ReactNode } from 'react'
import { useContext, useRef, useState } from 'react'
import { Divider, MenuItem, Popover, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import OutgoingIcon from '@/public/images/transactions/outgoing.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { SafeTxContext, type GtfPaymentMode } from '@/components/tx-flow/SafeTxProvider'
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
        <ArrowDropDownIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
      </div>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 100, borderRadius: '8px' } } }}
      >
        {PAYMENT_SOURCES.map((source) => (
          <MenuItem key={source} selected={source === value} onClick={() => handleSelect(source)}>
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
  const selected = availableGasTokens?.find((t) => t.address === selectedGasToken) ?? availableGasTokens?.[0]
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
        {selected?.logoUri && (
          <img src={selected.logoUri} alt={selected.symbol} width={24} height={24} className={css.tokenLogo} />
        )}
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
          <ArrowDropDownIcon sx={{ fontSize: '16px', color: 'text.secondary' }} />
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
            key={token.address}
            selected={token.address === selectedGasToken}
            onClick={() => handleSelect(token.address)}
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
  const nativeToken = availableGasTokens?.[0]

  return (
    <div className={css.signerFeeNotice}>
      <div className={css.signerFeeNoticeRow}>
        <Typography variant="body2" fontWeight={700}>
          Fees will be paid from the signer using
        </Typography>
        {nativeToken?.logoUri && (
          <img src={nativeToken.logoUri} alt={nativeToken.symbol} width={24} height={24} className={css.tokenLogo} />
        )}
        <Typography variant="body2" fontWeight={700}>
          {nativeToken?.symbol}
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
  const token = availableGasTokens?.find((t) => t.address === selectedGasToken) ?? availableGasTokens?.[0]

  return (
    <div className={css.signerFeeNoticeRow}>
      <Typography variant="body2" fontWeight={700}>
        Fees will be paid from your Safe using
      </Typography>
      {token?.logoUri && (
        <img src={token.logoUri} alt={token.symbol} width={24} height={24} className={css.tokenLogo} />
      )}
      <Typography variant="body2" fontWeight={700}>
        {token?.symbol}
      </Typography>
    </div>
  )
}

const FeesPreview = (props: FeesPreviewData): ReactElement => {
  const { canCoverFees, isConfirmation, executionFee, gasFee, totalOutgoing, availableGasTokens, selectedGasToken } =
    props
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
          <SvgIcon component={OutgoingIcon} inheritViewBox className={css.howFeesWorkIcon} sx={{ fontSize: '16px' }} />
        </a>
      </div>

      <div className={css.feeCard}>
        {/* Not the first signer — fees already locked */}
        {isConfirmation && canCoverFees && (
          <>
            <ConfirmationFeeNotice availableGasTokens={availableGasTokens} selectedGasToken={selectedGasToken} />

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

      {displayedOutgoing && <TotalOutgoingSection totalOutgoing={displayedOutgoing} />}
    </div>
  )
}

export default FeesPreview
