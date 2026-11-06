import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { CalendarClock, Check, ChevronDown } from 'lucide-react'
import { Alert } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { formatWithSchema } from '@safe-global/utils/utils/date'
import { PRO_TRIAL_BANNER_COPY as COPY } from './copy'

export type ProTrialBannerProps = {
  /** When the trial ends, in ms. */
  endsAt: number
  /** Calendar days until `endsAt`; 0 on the last day. */
  daysLeft: number
  /** The last days of the trial: the banner names a plan to upgrade to. */
  isUrgent: boolean
  /** The plan the Upgrade button names, e.g. "Business 10". */
  planName: string
  plansHref: LinkProps['href']
  talkToUsHref: string
  /** Members who can't buy see the status and details without the Upgrade button. */
  canUpgrade?: boolean
}

/** One quiet line while the trial has time left; a named upgrade in its last days. Never blocks the page. */
const ProTrialBanner = ({
  endsAt,
  daysLeft,
  isUrgent,
  planName,
  plansHref,
  talkToUsHref,
  canUpgrade = true,
}: ProTrialBannerProps) => {
  const endsOn = formatWithSchema(endsAt, 'MMM d')

  return (
    <Alert
      variant={isUrgent ? 'info' : 'subtle'}
      // A landmark, not a live alert: it sits on every page and must not interrupt a screen reader each time.
      role="region"
      aria-label={COPY.regionLabel}
      className="py-2.5"
      data-testid="pro-trial-banner"
      data-urgency={isUrgent ? 'urgent' : 'normal'}
    >
      <Collapsible>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock aria-hidden className="size-4 shrink-0" />
            <Typography
              variant={isUrgent ? 'paragraph-small-medium' : 'paragraph-small'}
              color={isUrgent ? 'default' : 'muted'}
              data-testid="pro-trial-status"
            >
              {isUrgent ? COPY.urgent.status(daysLeft, endsOn) : COPY.normal.status(endsOn)}
            </Typography>
          </div>

          <CollapsibleTrigger
            render={<Button variant="ghost-muted" size="xs" />}
            className="group/details"
            data-testid="pro-trial-details-toggle"
          >
            {COPY.details.toggle}
            <ChevronDown aria-hidden className="transition-transform group-aria-expanded/details:rotate-180" />
          </CollapsibleTrigger>

          <div className="ml-auto flex items-center gap-4">
            {isUrgent ? (
              <>
                <Link href={talkToUsHref} target="_blank" rel="noopener noreferrer" variant="muted">
                  {COPY.urgent.talkToUs}
                </Link>
                {canUpgrade && (
                  <Button size="sm" render={<NextLink href={plansHref} />} data-testid="pro-trial-upgrade">
                    {COPY.urgent.upgrade(planName)}
                  </Button>
                )}
              </>
            ) : (
              <Link render={<NextLink href={plansHref} />} variant="muted">
                {COPY.normal.seePlans}
              </Link>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <ul className="mt-2 flex flex-col gap-1 pb-1 pl-6" data-testid="pro-trial-details">
            {COPY.details.lines.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success-strong" />
                <Typography variant="paragraph-small" color="muted">
                  {line}
                </Typography>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </Alert>
  )
}

export default ProTrialBanner
