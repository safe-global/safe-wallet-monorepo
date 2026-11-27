import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import HistoryFeesAccordion from '@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'
import { FeeBreakdownRow } from '@safe-global/views/features/fee-payment/components/shared/FeeBreakdownRow'
import css from '@safe-global/views/features/fee-payment/components/HistoryFeesAccordion/styles.module.css'
import type { HistoryFeesData } from '@safe-global/views/features/fee-payment/types'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

type Placement = 'below' | 'inside' | 'summary'

const PAID_BY_SIGNER: HistoryFeesData = {
  totalFee: { amount: '0.0012', currency: 'ETH', fiatAmount: '$3.61' },
  executionFee: { label: 'Execution fee', isFree: true },
  gasFee: { label: 'Gas fee', amount: '0.0012', currency: 'ETH', fiatAmount: '$3.61' },
  paidFrom: 'signer',
}

const LIVE_TODAY: HistoryFeesData = { ...PAID_BY_SIGNER, gasFee: { ...PAID_BY_SIGNER.gasFee, label: 'Max gas fee' } }

const HINT = "Don't pay gas fees. Get sponsored transactions with Pro."

const Chip = () => (
  <span className="block h-5 w-8 shrink-0" role="img" aria-label="Safe Pro">
    <ProChip className="size-full" />
  </span>
)

/** Same button as the Fees card upsell in the transaction flow. */
const TryButton = () => (
  <Button variant="outline" size="xs" className="shrink-0">
    Upgrade to
    <span className="block h-4 w-6" aria-label="Safe Pro">
      <ProChip className="size-full" />
    </span>
  </Button>
)

/** Grey, sentence-case "Free", as decided for the fees card in the sign flow. */
const FreeExecutionFeeRow = ({ label }: { label: string }) => (
  <div className="flex min-h-10 items-center justify-between">
    <Typography variant="paragraph-small">{label}</Typography>
    <Typography variant="paragraph-small" color="muted">
      Free
    </Typography>
  </div>
)

/** Today's fees card with the agreed fee copy, plus the hint inside the breakdown or next to who paid. */
const FeesCard = ({ data, placement }: { data: HistoryFeesData; placement: Placement }): ReactElement => (
  <Accordion defaultValue={placement === 'below' ? [] : ['history-fees']}>
    <AccordionItem
      value="history-fees"
      className={cn(
        css.feesAccordion,
        'relative overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-background-paper)] data-open:border-[var(--color-info-dark)]',
      )}
      style={placement === 'below' ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined}
    >
      <AccordionTrigger className="min-h-[56px] items-center rounded-none border-none px-4 data-panel-open:bg-[var(--color-info-background)]">
        <div className={css.summaryContent}>
          <div className={css.summaryLeftColumn}>
            <Typography variant="paragraph-small-bold">Fees</Typography>
            <span className="flex items-center gap-2">
              <Typography variant="paragraph-mini" color="muted">
                Paid from signer wallet
              </Typography>
              {placement === 'summary' && (
                <span className="flex items-center gap-1">
                  <Chip />
                  <Typography variant="paragraph-mini" color="muted">
                    could cover this
                  </Typography>
                </span>
              )}
            </span>
          </div>
          <div className={css.summaryRight}>
            <Typography variant="paragraph-small-bold">
              {data.totalFee.amount} {data.totalFee.currency}
            </Typography>
            <Typography variant="paragraph-mini" color="muted">
              {data.totalFee.fiatAmount}
            </Typography>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0">
        <div className={css.breakdownContainer}>
          <FreeExecutionFeeRow label={data.executionFee.label} />
          <FeeBreakdownRow {...data.gasFee} strikeAs="del" />
          {placement === 'inside' && (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-light)] pt-2">
              <Typography variant="paragraph-small">{HINT}</Typography>
              <TryButton />
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

/** The fees card with square bottom corners, so the strip underneath joins it cleanly. */
const BelowStrip = ({ data }: { data: HistoryFeesData }): ReactElement => (
  <div>
    <FeesCard data={data} placement="below" />
    <div className="-mt-px flex items-center justify-between gap-3 rounded-b-lg border border-[var(--color-border-light)] bg-[var(--color-background-paper)] px-4 py-3">
      <Typography variant="paragraph-small">{HINT}</Typography>
      <TryButton />
    </div>
  </div>
)

const ProHint = ({ placement, data = PAID_BY_SIGNER }: { placement: Placement; data?: HistoryFeesData }) =>
  placement === 'below' ? <BelowStrip data={data} /> : <FeesCard data={data} placement={placement} />

const LABEL: Record<Placement, string> = {
  below: 'A · Strip under the fees card',
  inside: 'B · Inside the fee breakdown',
  summary: 'C · Next to who paid',
}

const meta = {
  title: 'Prototypes/Pro hint in history fees',
  component: ProHint,
  args: { placement: 'below' },
  argTypes: { placement: { control: 'inline-radio', options: ['below', 'inside', 'summary'] } },
  decorators: [
    (Story) => (
      <div className="max-w-[720px]">
        <Story />
      </div>
    ),
  ],
  tags: ['skip-visual-test'],
} satisfies Meta<typeof ProHint>

export default meta
type Story = StoryObj<typeof meta>

export const AllOptions: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Typography variant="paragraph-small" color="muted">
          Today: a free user who paid gas from their signer wallet
        </Typography>
        <HistoryFeesAccordion data={LIVE_TODAY} />
      </div>
      {(['below', 'inside', 'summary'] as const).map((placement) => (
        <div key={placement} className="flex flex-col gap-2">
          <Typography variant="paragraph-small" color="muted">
            {LABEL[placement]}
          </Typography>
          <ProHint placement={placement} />
        </div>
      ))}
    </div>
  ),
}

export const StripBelow: Story = { args: { placement: 'below' } }
export const InsideBreakdown: Story = { args: { placement: 'inside' } }
export const NextToWhoPaid: Story = { args: { placement: 'summary' } }
