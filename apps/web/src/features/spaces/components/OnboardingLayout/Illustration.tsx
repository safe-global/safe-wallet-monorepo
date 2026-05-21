import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'

const SkeletonBar = ({ className }: { className?: string }) => (
  <div className={cn('h-2 rounded-full bg-muted-foreground/15', className)} />
)

const OnboardingIllustration = (): ReactElement => (
  <div className="pointer-events-none relative aspect-[5/4] w-[78%] max-w-[640px]">
    {/* Sidebar mock */}
    <div className="absolute left-[2%] top-[8%] flex h-[82%] w-[36%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#12FF80] text-xs font-semibold text-[#0a0a0a]">
          A
        </div>
        <div className="flex flex-col gap-1">
          <SkeletonBar className="w-16 bg-muted-foreground/30" />
          <SkeletonBar className="h-1.5 w-10 bg-muted-foreground/20" />
        </div>
      </div>
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonBar key={i} className={cn('w-full', i === 1 && 'w-3/4', i === 4 && 'w-2/3', i === 7 && 'w-4/5')} />
      ))}
    </div>

    {/* Workspace panel mock */}
    <div className="absolute right-[2%] top-[14%] flex h-[72%] w-[56%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <SkeletonBar className="mb-2 h-3 w-1/3 bg-muted-foreground/30" />
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBar key={i} className={cn('h-3 w-full', i === 2 && 'w-5/6', i === 5 && 'w-3/4')} />
      ))}
    </div>
  </div>
)

export default OnboardingIllustration
