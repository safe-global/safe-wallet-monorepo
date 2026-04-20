import type { ReactElement } from 'react'
import { useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, SvgIcon, Tooltip, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { HistoryFeesData } from '../../hooks/useHistoryFeesBreakdown'
import type { FeeRow as FeeRowType } from '../../hooks/useFeesPreview'
import css from './styles.module.css'
import accordionCss from '@/styles/accordion.module.css'

const FEES_TOOLTIP = 'Total fees paid for this transaction, including execution and network costs.'
const EXECUTION_FEE_TOOLTIP =
  'Covers third-party services required to securely execute this transaction. Based on the transaction amount. Currently free while the new model is introduced.'
const GAS_FEE_TOOLTIP = 'Network cost required to process this transaction on the blockchain.'

const FeeBreakdownRow = ({
  label,
  amount,
  currency,
  fiatAmount,
  isFree,
  tooltip,
}: FeeRowType & { tooltip?: string }): ReactElement => (
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
      <div className={css.feeAmount}>
        {isFree && (
          <Typography variant="body2" component="span" color="success.main" fontWeight={700}>
            FREE
          </Typography>
        )}
        {amount && (
          <Typography variant="body2" component={isFree ? 'del' : 'span'} color={isFree ? 'text.secondary' : undefined}>
            {amount} {currency}
          </Typography>
        )}
      </div>
      {fiatAmount && (
        <Typography variant="caption" color="text.secondary">
          {fiatAmount}
        </Typography>
      )}
    </div>
  </div>
)

const HistoryFeesAccordion = ({ data }: { data: HistoryFeesData }): ReactElement => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Accordion
      elevation={0}
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      className={css.feesAccordion}
      disableGutters
      sx={{
        '&::before': { display: 'none' },
        backgroundColor: 'background.paper',
        '&:hover': { borderColor: 'border.light' },
        '&:hover > .MuiAccordionSummary-root': { background: 'background.paper' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className={accordionCss.accordion}
        data-testid="history-fees-summary"
        sx={{ '&.Mui-expanded': { backgroundColor: 'background.paper' } }}
      >
        <div className={css.summaryContent}>
          <div className={css.summaryLeft}>
            <Typography variant="subtitle2" fontWeight={700}>
              Fees
            </Typography>
            <Tooltip title={FEES_TOOLTIP} placement="top" arrow>
              <span className={css.tooltipIcon}>
                <SvgIcon component={InfoIcon} inheritViewBox sx={{ fontSize: '16px' }} color="border" />
              </span>
            </Tooltip>
          </div>

          <div className={css.summaryRight}>
            <Typography variant="subtitle2" fontWeight={700}>
              {data.totalFee.amount} {data.totalFee.currency}
            </Typography>
            {data.totalFee.fiatAmount && (
              <Typography variant="caption" color="text.secondary">
                {data.totalFee.fiatAmount}
              </Typography>
            )}
          </div>
        </div>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <div className={css.breakdownContainer}>
          <FeeBreakdownRow {...data.executionFee} tooltip={EXECUTION_FEE_TOOLTIP} />
          <FeeBreakdownRow {...data.gasFee} tooltip={GAS_FEE_TOOLTIP} />
        </div>
      </AccordionDetails>
    </Accordion>
  )
}

export default HistoryFeesAccordion
