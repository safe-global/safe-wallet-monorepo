import { useEffect } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import css from './styles.module.css'
import { safeProMoveHeadline } from '../../utils/safeProMoveHeadline'

const SafeProBanner = ({
  className,
  location = 'workspaces_sign_in',
}: {
  className?: string
  location?: SafeProBannerLocation
}) => {
  const isLive = useIsSafeProEnabled()
  useEffect(() => {
    trackEvent(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: location })
  }, [location])

  return (
    <Card
      as="a"
      href={SAFE_PRO_ANNOUNCEMENT_URL}
      onClick={() => trackSafeProBannerClick(location)}
      target="_blank"
      rel="noopener noreferrer"
      size="none"
      radius="lg"
      className={cn('min-h-[46px] w-full justify-center', css.banner, className)}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge variant="subtle" shape="tag" className={css.tag}>
            <Sparkles strokeWidth={ICON_STROKE} className="max-md:hidden" />
            New
          </Badge>
          <Typography variant="paragraph-small-bold" className="truncate">
            {safeProMoveHeadline(isLive)}
          </Typography>
        </div>

        <span aria-hidden className={cn('hidden size-8 shrink-0 items-center justify-center md:flex', css.arrow)}>
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Card>
  )
}

export default SafeProBanner
