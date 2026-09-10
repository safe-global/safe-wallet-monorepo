import { ArrowUpRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import { trackSafeProBannerClick } from '../../utils/trackSafeProBannerClick'
import css from './styles.module.css'

const SafeProSidebarBanner = ({ className, onDismiss }: { className?: string; onDismiss?: () => void }) => (
  <div
    className={cn(
      'relative flex w-full flex-col items-start gap-3 rounded-lg bg-muted bg-no-repeat p-4 shadow-lg',
      css.banner,
      className,
    )}
    data-testid="safe-pro-sidebar-banner"
  >
    {onDismiss && (
      <button
        type="button"
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        onClick={onDismiss}
        aria-label="Dismiss"
        data-testid="safe-pro-sidebar-banner-dismiss"
      >
        <X className="size-4" />
      </button>
    )}

    <span className={cn('flex shrink-0 items-center rounded-sm px-2 py-1.5', css.proChip)}>
      <ProWordmark className="h-2 w-[21px] overflow-visible" />
    </span>

    {/* Grows to fill the slot, so the button below stays at the bottom edge and keeps its place
        when this banner gives way to another one whose copy wraps to fewer lines. */}
    <div className="flex w-full flex-1 flex-col gap-1">
      <Typography variant="paragraph-small-bold" className="text-foreground">
        Your Workspace moves to Safe Pro on Oct 6, 2026
      </Typography>
      <Typography variant="paragraph-mini" color="muted">
        Your Safe accounts remain available outside the Workspace.
      </Typography>
    </div>

    <Button
      size="xs"
      render={
        <a
          onClick={() => trackSafeProBannerClick('sidebar')}
          href={SAFE_PRO_ANNOUNCEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
        />
      }
      className={css.learnMore}
    >
      Learn more
      <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
    </Button>
  </div>
)

export default SafeProSidebarBanner
