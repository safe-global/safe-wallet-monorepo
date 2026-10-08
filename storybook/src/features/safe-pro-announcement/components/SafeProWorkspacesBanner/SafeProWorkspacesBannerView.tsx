import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { safeProMoveHeadline } from '@/features/safe-pro-announcement/utils/safeProMoveHeadline'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import css from './styles.module.css'

export type SafeProWorkspacesBannerViewProps = {
  bannerClassName?: string
  isDarkMode: boolean
  isLive: boolean
  learnMoreHref: string
  onLearnMoreClick: () => void
}

export const SafeProWorkspacesBannerView = ({
  bannerClassName,
  isDarkMode,
  isLive,
  learnMoreHref,
  onLearnMoreClick,
}: SafeProWorkspacesBannerViewProps) => {
  return (
    <ShadcnProvider dark={isDarkMode} className={bannerClassName}>
      <Card size="none" radius="xl" className={cn('w-full', css.banner)}>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className={cn('flex shrink-0 items-center rounded-md', css.proChip)}>
            <ProWordmark className="h-3 w-8 overflow-visible" />
          </span>

          <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <Typography variant="paragraph-large-bold">{safeProMoveHeadline(isLive)}</Typography>
              <Typography variant="paragraph-small" color="muted">
                Your Safe accounts remain free in My accounts.
              </Typography>
            </div>

            <Button
              render={<a onClick={onLearnMoreClick} href={learnMoreHref} target="_blank" rel="noopener noreferrer" />}
              className={cn('shrink-0', css.learnMore)}
            >
              Learn more
              <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
            </Button>
          </div>
        </div>
      </Card>
    </ShadcnProvider>
  )
}
