import type { ReactElement } from 'react'
import {
  Accordion,
  accordionClasses,
  AccordionDetails,
  AccordionSummary,
  accordionSummaryClasses,
  styled,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { HistoryFeesData } from '../../hooks/useHistoryFeesBreakdown'
import { FeeBreakdownRow } from '../shared/FeeBreakdownRow'
import { GAS_FEE_TOOLTIP } from '../shared/tooltips'
import css from './styles.module.css'
import accordionCss from '@/styles/accordion.module.css'

// Match ColorCodedTxAccordion ("Transaction details") so both accordions stack with matching
// border + summary background per tx category. CSS vars are theme-aware — no light/dark branch.
type AccordionPalette = { border: string; bg: string }
const TX_PALETTE_BY_TYPE: Record<string, AccordionPalette> = {
  Transfer: { border: 'var(--color-success-light)', bg: 'var(--color-background-light)' },
  SwapTransfer: { border: 'var(--color-success-light)', bg: 'var(--color-background-light)' },
  TwapOrder: { border: 'var(--color-success-light)', bg: 'var(--color-background-light)' },
  NativeStakingDeposit: { border: 'var(--color-success-light)', bg: 'var(--color-background-light)' },
  SettingsChange: { border: 'var(--color-warning-light)', bg: 'var(--color-warning-background)' },
}
const DEFAULT_PALETTE: AccordionPalette = { border: 'var(--color-info-dark)', bg: 'var(--color-info-background)' }

const StyledAccordion = styled(Accordion, {
  shouldForwardProp: (p) => p !== 'palette',
})<{ palette: AccordionPalette }>(({ palette }) => ({
  [`&.${accordionClasses.expanded}.${accordionClasses.root}, &:hover.${accordionClasses.root}`]: {
    borderColor: palette.border,
    position: 'relative',
    zIndex: 1,
  },
  [`&.${accordionClasses.expanded} > * > .${accordionSummaryClasses.root}`]: {
    backgroundColor: palette.bg,
  },
}))

const HistoryFeesAccordion = ({
  data,
  txInfo,
}: {
  data: HistoryFeesData
  txInfo?: TransactionDetails['txInfo']
}): ReactElement => {
  const palette = (txInfo?.type && TX_PALETTE_BY_TYPE[txInfo.type]) || DEFAULT_PALETTE

  return (
    <StyledAccordion elevation={0} palette={palette} className={css.feesAccordion}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className={accordionCss.accordion}
        data-testid="history-fees-summary"
      >
        <div className={css.summaryContent}>
          <div className={css.summaryLeftColumn}>
            <div className={css.summaryLeft}>
              <Typography variant="subtitle2" fontWeight={700}>
                Fees
              </Typography>
            </div>
            <Typography variant="caption" color="text.secondary">
              {data.paidFrom === 'safe' ? 'Paid from the Safe' : 'Paid from the signer'}
            </Typography>
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
          <FeeBreakdownRow {...data.executionFee} strikeAs="del" />
          <FeeBreakdownRow {...data.gasFee} tooltip={GAS_FEE_TOOLTIP} strikeAs="del" />
        </div>
      </AccordionDetails>
    </StyledAccordion>
  )
}

export default HistoryFeesAccordion
