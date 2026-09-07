import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import css from './styles.module.css'

const SafeProBanner = ({ className }: { className?: string }) => (
  <a
    href={SAFE_PRO_ANNOUNCEMENT_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      'flex min-h-[46px] w-full flex-col justify-center overflow-hidden rounded-lg bg-card text-sm text-card-foreground',
      css.banner,
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Badge variant="secondary" className={cn('rounded-sm', css.tag)}>
          <Sparkles strokeWidth={ICON_STROKE} className="max-md:hidden" />
          New
        </Badge>
        <Typography variant="paragraph-small-bold">Workspaces move to Safe Pro on Oct 6, 2026</Typography>
      </div>

      <span aria-hidden className={cn('hidden size-8 shrink-0 items-center justify-center md:flex', css.arrow)}>
        <ArrowUpRight className="size-4" />
      </span>
    </div>
  </a>
)

export default SafeProBanner
