import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

const copy = (trialDays: number | null) => {
  if (trialDays === null) {
    return {
      title: (
        <>
          Your <span className={css.highlight}>Safe Pro</span> Workspace is locked
        </>
      ),
      body: 'Your Workspace has no active plan. Choose a plan to unlock it. Your Safe accounts remain available outside the Workspace.',
    }
  }
  if (trialDays === MIGRATED_TRIAL_DAYS) {
    return {
      title: (
        <>
          Your Workspace moved to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
        </>
      ),
      body: 'You’ve used Safe before, so your trial is 60 days instead of 30. Start it any time in the next 60 days. Your Safe accounts remain available outside the Workspace.',
    }
  }
  return {
    title: (
      <>
        Your Workspace is ready for <span className={css.highlight}>Safe Pro</span>
      </>
    ),
    body: `Start your ${trialDays}-day free trial to unlock the Workspace. Your Safe accounts remain available outside the Workspace.`,
  }
}

const SafeProLockedWorkspace = ({
  trialDays,
  onStartTrial,
  plansHref,
}: {
  /** Null when the CGW offers no trial (the Workspace subscribed before): the CTA leads to the Plans page instead. */
  trialDays: number | null
  onStartTrial: () => void
  plansHref: LinkProps['href']
}) => {
  const { title, body } = copy(trialDays)

  return (
    <Card
      size="none"
      // eslint-disable-next-line no-restricted-syntax -- Figma spec calls for a 32px corner one-off; no radius token in the scale matches it
      className="w-full rounded-[2rem]"
    >
      <div className="p-1">
        <SafeProHero />

        <div className="flex flex-col items-center gap-6 px-8 py-6">
          <div className="flex flex-col items-center gap-2">
            <Typography variant="h3" align="center">
              {title}
            </Typography>

            <Typography color="muted" align="center" className="max-w-[685px]">
              {body}
            </Typography>
          </div>

          {trialDays === null ? (
            <Button size="lg" accentIcon className="w-[250px]" render={<NextLink href={plansHref} />}>
              See plans
              <ArrowRight data-icon="inline-end" className="size-5" />
            </Button>
          ) : (
            <Button size="lg" accentIcon className="w-[250px]" onClick={onStartTrial}>
              Start free trial
              <ArrowRight data-icon="inline-end" className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SafeProLockedWorkspace
