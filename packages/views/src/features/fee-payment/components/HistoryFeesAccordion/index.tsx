import type { CSSProperties, ReactElement } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { HistoryFeesData } from '@safe-global/views/features/fee-payment/types'
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
  SettingsChange: { border: 'var(--warning-outline)', bg: 'var(--warning-subtle)' },
}
const DEFAULT_PALETTE: AccordionPalette = { border: 'var(--color-info-dark)', bg: 'var(--color-info-background)' }

const PAID_FROM_LABEL: Record<HistoryFeesData['paidFrom'], string> = {
  safe: 'Paid from Safe account',
  signer: 'Paid from signer wallet',
  sponsored: 'Sponsored',
}

/** The total paid; for a sponsored tx, what it would have cost, struck through. */
const SummaryTotal = ({ data }: { data: HistoryFeesData }): ReactElement => {
  const { amount, currency, fiatAmount } = data.totalFee

  if (data.paidFrom === 'sponsored') {
    return (
      <Typography variant="paragraph-small" as="del" color="muted">
        {amount} {currency}
      </Typography>
    )
  }

  return (
    <>
      <Typography variant="paragraph-small-bold">
        {amount} {currency}
      </Typography>
      {fiatAmount && (
        <Typography variant="paragraph-mini" color="muted">
          {fiatAmount}
        </Typography>
      )}
    </>
  )
}

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
          // overflow-hidden: the trigger's square open/hover background must be clipped by the
          // item's rounded corners (same approach as ColorCodedTxAccordion's card).
          'relative overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-background-paper)] hover:z-[1] hover:border-[var(--fees-accordion-border)] data-open:z-[1] data-open:border-[var(--fees-accordion-border)]',
        )}
      >
        <AccordionTrigger
          data-testid="history-fees-summary"
          className="min-h-[56px] items-center rounded-none border-none px-4 data-panel-open:bg-[var(--fees-accordion-bg)]"
        >
          <div className={css.summaryContent}>
            <div className={css.summaryLeftColumn}>
              <div className={css.summaryLeft}>
                <Typography variant="paragraph-small-bold">Fees</Typography>
              </div>
              <Typography variant="paragraph-mini" color="muted" data-testid="history-fees-paid-from">
                {PAID_FROM_LABEL[data.paidFrom]}
              </Typography>
            </div>

            <div className={css.summaryRight}>
              <SummaryTotal data={data} />
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
