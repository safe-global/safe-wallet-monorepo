import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const SafeProLockedWorkspace = ({ onStartTrial }: { onStartTrial: () => void }) => (
  <Card size="none" radius="xl" className="w-full">
    <div className="p-1">
      <SafeProHero />

      <div className="flex flex-col items-center gap-6 px-8 py-6">
        <div className="flex flex-col items-center gap-2">
          <Typography variant="h3" align="center">
            Your Workspace moved to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
          </Typography>

          <Typography color="muted" align="center" className="max-w-[685px]">
            You&apos;ve used Safe before, so your trial is 60 days instead of 30. Start it any time in the next 60 days.
            Your Safe accounts remain available outside the Workspace.
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

export default SafeProLockedWorkspace
