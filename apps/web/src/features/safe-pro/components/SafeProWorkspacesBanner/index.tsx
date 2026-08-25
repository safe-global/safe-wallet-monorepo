import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'
import css from './styles.module.css'

const SafeProWorkspacesBanner = ({ className }: { className?: string }) => {
  const isDarkMode = useDarkMode()

  return (
    <ShadcnProvider dark={isDarkMode} className={className}>
      <Card size="none" radius="xl" className={cn('w-full', css.banner)}>
        <div className="flex items-center gap-3">
          <span className={cn('flex shrink-0 items-center rounded-md text-foreground', css.proChip)}>
            <ProWordmark />
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <Typography variant="paragraph-large-bold">Workspaces move to Pro on Oct 1, 2026</Typography>
              <Typography variant="paragraph-small" color="muted">
                Your Safe accounts stay free in My accounts.
              </Typography>
            </div>

            <Button
              render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}
              className="shrink-0"
            >
              Learn more
              <ArrowUpRight data-icon="inline-end" className={css.ctaArrow} />
            </Button>
          </div>
        </div>
      </Card>
    </ShadcnProvider>
  )
}

export default SafeProWorkspacesBanner
