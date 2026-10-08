import type { ReactElement, ReactNode } from 'react'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { AnalysisGroupCardItem } from '@/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCardItem'
import { Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'

/** Muted inset for the transaction-details Safenet card — same surface as Receipt / PaperViewToggle. */
export const SafenetDetailsPanel = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="rounded-md bg-[var(--color-background-main)] px-4 py-3">{children}</div>
)

const detailsStackClass =
  'flex flex-col divide-y divide-[var(--color-border-light)] [&>*]:py-3 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0'

/** Divided rows inside {@link SafenetDetailsPanel}. */
export const SafenetDetailsPanelStack = ({ children }: { children: ReactNode }): ReactElement => (
  <div className={detailsStackClass}>{children}</div>
)

/** Gray block with a severity bar, the same component Copilot's checks expand into. */
export const SafenetBlock = ({ severity, children }: { severity?: Severity; children: ReactNode }): ReactElement => (
  <AnalysisGroupCardItem
    severity={severity}
    result={{ severity: severity ?? Severity.INFO, type: ThreatStatus.NO_THREAT, title: '', description: '' }}
    description={children}
  />
)

/** Running check: a pulsing dot in the slot a severity icon takes once there's a result. */
export const SafenetPulse = ({ size = 16 }: { size?: 12 | 16 }): ReactElement => (
  <span
    className={`relative flex shrink-0 items-center justify-center ${size === 12 ? 'size-3' : 'size-4'}`}
    data-testid="safenet-check-pulse"
    aria-hidden
  >
    <span
      className={`absolute inline-flex animate-ping rounded-full bg-[var(--color-info-main)] opacity-50 motion-reduce:animate-none ${size === 12 ? 'size-2.5' : 'size-3'}`}
    />
    <span
      className={`relative inline-flex rounded-full bg-[var(--color-info-main)] ${size === 12 ? 'size-1.5' : 'size-2'}`}
    />
  </span>
)
