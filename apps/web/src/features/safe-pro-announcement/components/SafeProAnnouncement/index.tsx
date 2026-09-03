import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import SafeProHero from '../SafeProHero'
import css from './styles.module.css'

const SafeProAnnouncement = ({ onDismiss }: { onDismiss?: () => void }) => (
  <div className="p-1">
    <SafeProHero />

    <div className="flex flex-col items-center gap-6 px-8 py-6">
      <div className="flex flex-col items-center gap-2">
        <Typography variant="h3" align="center">
          Your Workspace moves to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
        </Typography>

        <Typography variant="paragraph-large" color="muted" align="center">
          Safe Pro will add advanced security checks, sponsored transactions and policies. Your Safe accounts remain
          available outside of the Workspace. Starting October 6, you can claim up to two months of Safe Pro for free
          for this Workspace.
        </Typography>
      </div>

      <div className="flex shrink-0 gap-3">
        {onDismiss && (
          <Button size="lg" variant="secondary" onClick={onDismiss}>
            Got it
          </Button>
        )}

        <Button size="lg" render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}>
          Learn more
          <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
        </Button>
      </div>
    </div>
  </div>
)

export default SafeProAnnouncement
