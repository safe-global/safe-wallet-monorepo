import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

// The CGW grants the 60-day grace only to Workspaces that predate enforcement; anything else is a new Workspace.
const MIGRATED_TRIAL_DAYS = 60

const SafeProLockedWorkspace = ({
  trialDays,
  onStartTrial,
}: {
  trialDays: number | null
  onStartTrial: () => void
}) => {
  const isMigrated = trialDays === MIGRATED_TRIAL_DAYS

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
              {isMigrated ? (
                <>
                  Your Workspace moved to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
                </>
              ) : (
                <>
                  Your Workspace is ready for <span className={css.highlight}>Safe Pro</span>
                </>
              )}
            </Typography>

            <Typography color="muted" align="center" className="max-w-[685px]">
              {isMigrated
                ? 'You’ve used Safe before, so your trial is 60 days instead of 30. Start it any time in the next 60 days. Your Safe accounts remain available outside the Workspace.'
                : `Start your ${trialDays ?? 30}-day free trial to unlock the Workspace. Your Safe accounts remain available outside the Workspace.`}
            </Typography>
          </div>

          <Button size="lg" accentIcon className="w-[250px]" onClick={onStartTrial}>
            Start free trial
            <ArrowRight data-icon="inline-end" className="size-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default SafeProLockedWorkspace
