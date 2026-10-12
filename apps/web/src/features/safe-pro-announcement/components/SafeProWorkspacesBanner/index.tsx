import { ArrowUpRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { ShadcnProvider } from '@safe-global/views/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { safeProMoveHeadline } from '../../utils/safeProMoveHeadline'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import { MixpanelEventParams } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import css from './styles.module.css'

const SafeProWorkspacesBanner = ({
  className,
  location = 'workspaces_list',
}: {
  className?: string
  location?: SafeProBannerLocation
}) => {
  const isDarkMode = useDarkMode()
  const isLive = useIsSafeProEnabled()
  useTrackOnce(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: location })

  return (
    <ShadcnProvider dark={isDarkMode} className={className}>
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
              render={
                <a
                  onClick={() => trackSafeProBannerClick(location)}
                  href={SAFE_PRO_ANNOUNCEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
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

export default SafeProWorkspacesBanner
