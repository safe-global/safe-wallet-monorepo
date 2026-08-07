import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { WORKSPACE_ANNOUNCEMENT_URL } from '@/config/constants'
import css from './styles.module.css'

const WorkspaceBanner = ({ className }: { className?: string }) => {
  return (
    <Card
      size="sm"
      className={cn(
        'w-full gap-0 rounded-lg border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05)]',
        css.banner,
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <Badge className="relative">
            <span className={css.shimmer} aria-hidden="true" />
            <Sparkles className="size-3" />
            New
          </Badge>
          <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">Introducing Workspace</span>
        </div>

        <Button
          variant="link"
          size="sm"
          className="group h-auto shrink-0 gap-1 px-0 text-xs font-medium"
          render={
            <a
              href={WORKSPACE_ANNOUNCEMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read the Workspace announcement"
            />
          }
        >
          Read announcement
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </div>
    </Card>
  )
}

export default WorkspaceBanner
