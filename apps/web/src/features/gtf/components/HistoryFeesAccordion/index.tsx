import type { CSSProperties, ReactElement } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { HistoryFeesData } from '../../hooks/useHistoryFeesBreakdown'
import { FeeBreakdownRow } from '../shared/FeeBreakdownRow'
import { GAS_FEE_TOOLTIP } from '../shared/tooltips'
import css from './styles.module.css'

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

const HistoryFeesAccordion = ({
  data,
  txInfo,
}: {
  data: HistoryFeesData
  txInfo?: TransactionDetails['txInfo']
}): ReactElement => {
  const palette = (txInfo?.type && TX_PALETTE_BY_TYPE[txInfo.type]) || DEFAULT_PALETTE

  const paletteVars = {
    '--fees-accordion-border': palette.border,
    '--fees-accordion-bg': palette.bg,
  } as CSSProperties

  return (
    <Accordion style={paletteVars}>
      <AccordionItem
        value="history-fees"
        className={cn(
          css.feesAccordion,
          'relative border border-[var(--color-border-light)] bg-[var(--color-background-paper)] hover:z-[1] hover:border-[var(--fees-accordion-border)] data-open:z-[1] data-open:border-[var(--fees-accordion-border)]',
        )}
      >
        <AccordionTrigger
          data-testid="history-fees-summary"
          className="min-h-[56px] rounded-none border-none px-4 hover:no-underline data-panel-open:bg-[var(--fees-accordion-bg)]"
        >
          <div className={css.summaryContent}>
            <div className={css.summaryLeftColumn}>
              <div className={css.summaryLeft}>
                <Typography variant="paragraph-small-bold">Fees</Typography>
              </div>
              <Typography variant="paragraph-mini" color="muted">
                {data.paidFrom === 'safe' ? 'Paid from the Safe' : 'Paid from the signer'}
              </Typography>
            </div>

            <div className={css.summaryRight}>
              <Typography variant="paragraph-small-bold">
                {data.totalFee.amount} {data.totalFee.currency}
              </Typography>
              {data.totalFee.fiatAmount && (
                <Typography variant="paragraph-mini" color="muted">
                  {data.totalFee.fiatAmount}
                </Typography>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0">
          <div className={css.breakdownContainer}>
            <FeeBreakdownRow {...data.executionFee} strikeAs="del" />
            <FeeBreakdownRow {...data.gasFee} tooltip={GAS_FEE_TOOLTIP} strikeAs="del" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default HistoryFeesAccordion
