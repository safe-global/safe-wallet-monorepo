import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { safeProMoveHeadline } from '@/features/safe-pro-announcement/utils/safeProMoveHeadline'
import css from './styles.module.css'

export type SafeProBannerViewProps = {
  bannerClassName?: string
  isLive: boolean
  href: string
  onClick: () => void
}

export const SafeProBannerView = ({ bannerClassName, isLive, href, onClick }: SafeProBannerViewProps) => {
  return (
    <Card
      as="a"
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      size="none"
      radius="lg"
      className={cn('min-h-[46px] w-full justify-center', css.banner, bannerClassName)}
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
