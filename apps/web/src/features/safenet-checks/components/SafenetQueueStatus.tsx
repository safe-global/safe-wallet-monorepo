import type { ReactElement } from 'react'
import { Chip } from '@/components/ui/chip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetDisplayStatus } from '../useSafenetDisplayStatus'
import { MULTIPLE_RULES_TITLE, STATUS_PRESENTATION } from '../statusPresentation'
import { formatFlaggedCount, summariseRejection } from '../summariseRejection'
import { formatSimulatingLabel } from '../checkTiming'
import { useCheckTiming } from '../useCheckTiming'

type VerdictStatus = Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>

export type SafenetQueueStatusVariant = 'inline' | 'chip'

const CHIP_VARIANT = {
  [CheckStatus.SUBMITTED]: 'info',
  [CheckStatus.IN_PROGRESS]: 'info',
  [CheckStatus.BENIGN]: 'positive',
  [CheckStatus.MALICIOUS]: 'negative',
  [CheckStatus.TIMED_OUT]: 'warning',
} as const satisfies Record<VerdictStatus, string>

export type SafenetQueueStatusProps = {
  safeTxHash: string
  /**
   * The queued transaction's submission date, offered to the shared aim
   * registry, which aims the read window with the earliest time any surface
   * knows. The confirm flow offers the same value from `submittedAt`.
   */
  timestampMs: number
  /** `chip` is the prominent queue-row treatment; `inline` is the quiet icon + label. */
  variant?: SafenetQueueStatusVariant
}

export type SafenetQueueStatusViewProps = {
  publicStatus: VerdictStatus
  snapshot: SafenetCheckSnapshot
  timestampMs: number
  variant?: SafenetQueueStatusVariant
}

const describeStatus = (publicStatus: VerdictStatus, snapshot: SafenetCheckSnapshot): string => {
  if (publicStatus !== CheckStatus.MALICIOUS) return STATUS_PRESENTATION[publicStatus].copy

  const summary = summariseRejection(snapshot.events)
  const title =
    summary.rules.length === 1
      ? `${summary.rules[0].label}.`
      : summary.rules.length > 1
        ? `${MULTIPLE_RULES_TITLE}.`
        : STATUS_PRESENTATION.MALICIOUS.copy
  const count = formatFlaggedCount(summary)
  return count ? `${title} ${count}` : title
}

/** Queue-row check state; the full sentence is in the tooltip and the row button's accessible name. */
export const SafenetQueueStatusView = ({
  publicStatus,
  snapshot,
  timestampMs,
  variant = 'inline',
}: SafenetQueueStatusViewProps): ReactElement => {
  const timing = useCheckTiming(snapshot, timestampMs)
  const { severity, label: stateLabel } = STATUS_PRESENTATION[publicStatus]
  const label = publicStatus === CheckStatus.IN_PROGRESS ? formatSimulatingLabel(timing) : stateLabel
  const description = describeStatus(publicStatus, snapshot)

  const content =
    variant === 'chip' ? (
      <Chip variant={CHIP_VARIANT[publicStatus]} className="max-w-full">
        <SeverityIcon severity={severity} width={12} height={12} />
        <span className="truncate">{label}</span>
      </Chip>
    ) : (
      <>
        <SeverityIcon severity={severity} />
        <Typography variant="paragraph-mini" className="truncate text-muted-foreground">
          {label}
        </Typography>
      </>
    )

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            data-testid="safenet-queue-status"
            data-status={publicStatus}
            data-variant={variant}
            role="status"
            aria-live="polite"
            className="inline-flex max-w-full items-center gap-1"
          >
            {content}
            <span className="sr-only">{`Safenet: ${description}`}</span>
          </div>
        }
      />
      <TooltipContent side="top">{description}</TooltipContent>
    </Tooltip>
  )
}

/** Renders nothing until a check has been observed for the hash. */
export const SafenetQueueStatus = ({
  safeTxHash,
  timestampMs,
  variant,
}: SafenetQueueStatusProps): ReactElement | null => {
  const display = useSafenetDisplayStatus(safeTxHash, timestampMs)
  if (!display) return null

  return (
    <SafenetQueueStatusView
      publicStatus={display.publicStatus}
      snapshot={display.snapshot}
      timestampMs={timestampMs}
      variant={variant}
    />
  )
}

export default SafenetQueueStatus
