import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import SafeProHero from '@/components/common/SafeProHero'
import css from './styles.module.css'

export type SafeProAnnouncementViewProps = {
  learnMoreHref: string
  onLearnMoreClick: () => void
  onDismiss?: () => void
}

export const SafeProAnnouncementView = ({
  learnMoreHref,
  onLearnMoreClick,
  onDismiss,
}: SafeProAnnouncementViewProps) => {
  return (
    <div className="p-1">
      <SafeProHero />

      <div className="flex flex-col items-center gap-6 px-8 py-6">
        <div className="flex flex-col items-center gap-3">
          <Typography variant="h4" align="center">
            Your Workspace moves to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
          </Typography>

          <Typography variant="paragraph" color="muted" align="center">
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

          <Button
            size="lg"
            render={<a onClick={onLearnMoreClick} href={learnMoreHref} target="_blank" rel="noopener noreferrer" />}
          >
            Learn more
            <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
          </Button>
        </div>
      </div>
    </div>
  )
}
