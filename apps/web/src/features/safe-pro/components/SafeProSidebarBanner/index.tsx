import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import css from './styles.module.css'

const SafeProSidebarBanner = ({ className }: { className?: string }) => (
  <div
    className={cn('flex w-full flex-col items-start gap-3 rounded-xl bg-muted p-4 shadow-lg', css.banner, className)}
    data-testid="safe-pro-sidebar-banner"
  >
    <span className={cn('flex shrink-0 items-center rounded-sm px-2 py-1.5', css.proChip)}>
      <ProWordmark className="h-2 w-[21px]" />
    </span>

    <div className="flex flex-col gap-1">
      <Typography variant="paragraph-small-bold" className="text-foreground">
        Your Workspace moves to Pro on Oct 1, 2026
      </Typography>
      <Typography variant="paragraph-mini" className="text-secondary-foreground">
        Your Safe accounts remain available outside the Workspace.
      </Typography>
    </div>

    <Button
      size="xs"
      render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}
      className={css.learnMore}
    >
      Learn more
      <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
    </Button>
  </div>
)

export default SafeProSidebarBanner
