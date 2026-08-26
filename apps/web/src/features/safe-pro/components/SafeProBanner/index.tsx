import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import css from './styles.module.css'

const SafeProBanner = ({ className }: { className?: string }) => (
  <Card
    as="a"
    href={SAFE_PRO_ANNOUNCEMENT_URL}
    target="_blank"
    rel="noopener noreferrer"
    size="none"
    radius="lg"
    className={cn('min-h-[46px] w-full justify-center', css.banner, className)}
  >
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Badge variant="subtle" shape="tag" className={css.tag}>
          <Sparkles />
          New
        </Badge>
        <Typography variant="paragraph-small-bold">Workspaces move to Pro on Oct 1, 2026</Typography>
      </div>

      <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center', css.arrow)}>
        <ArrowUpRight className="size-4" />
      </span>
    </div>
  </Card>
)

export default SafeProBanner
