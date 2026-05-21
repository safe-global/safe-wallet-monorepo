import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'

type IllustrationVariant = 'create' | 'add-safes' | 'invite-members' | 'default'

type OnboardingIllustrationProps = {
  variant?: IllustrationVariant
  spaceName?: string
}

const SkeletonBar = ({ className }: { className?: string }) => (
  <div className={cn('h-2 rounded-full bg-muted-foreground/15', className)} />
)

const getInitial = (name?: string): string => {
  const trimmed = name?.trim()
  if (!trimmed) return 'S'
  return trimmed[0].toUpperCase()
}

const Sidebar = ({ spaceName }: { spaceName?: string }): ReactElement => {
  const initial = getInitial(spaceName)
  const display = spaceName?.trim() || 'Space name'
  const hasName = Boolean(spaceName?.trim())

  return (
    <div className="absolute left-[2%] top-[8%] flex h-[82%] w-[36%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#12FF80] text-xs font-semibold text-[#0a0a0a]">
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'truncate text-xs font-semibold leading-tight',
              hasName ? 'text-foreground' : 'text-muted-foreground/40',
            )}
          >
            {display}
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground/50">Space</span>
        </div>
      </div>
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonBar key={i} className={cn('w-full', i === 1 && 'w-3/4', i === 4 && 'w-2/3', i === 7 && 'w-4/5')} />
      ))}
    </div>
  )
}

const ContentPanel = ({ variant }: { variant: IllustrationVariant }): ReactElement => {
  if (variant === 'add-safes') {
    return (
      <div className="absolute right-[2%] top-[14%] flex h-[72%] w-[56%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-2 ring-[#12FF80] ring-offset-2 ring-offset-[var(--onboarding-illustration-bg,_#f4f4f4)]">
        <p className="mb-2 text-sm font-semibold leading-tight text-foreground">Accounts</p>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className={cn('h-3 w-full', i === 2 && 'w-5/6', i === 4 && 'w-3/4')} />
        ))}
      </div>
    )
  }

  if (variant === 'invite-members') {
    return (
      <div className="absolute right-[2%] top-[14%] flex h-[72%] w-[56%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-2 ring-[#12FF80] ring-offset-2 ring-offset-[var(--onboarding-illustration-bg,_#f4f4f4)]">
        <p className="mb-2 text-sm font-semibold leading-tight text-foreground">Members</p>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-7 shrink-0 rounded-full bg-muted-foreground/15" />
            <div className="flex flex-1 flex-col gap-1">
              <SkeletonBar className={cn('h-2', i % 2 === 0 ? 'w-3/4' : 'w-2/3')} />
              <SkeletonBar className="h-1.5 w-1/2 bg-muted-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute right-[2%] top-[14%] flex h-[72%] w-[56%] flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <SkeletonBar className="mb-2 h-3 w-1/3 bg-muted-foreground/30" />
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBar key={i} className={cn('h-3 w-full', i === 2 && 'w-5/6', i === 5 && 'w-3/4')} />
      ))}
    </div>
  )
}

const OnboardingIllustration = ({ variant = 'default', spaceName }: OnboardingIllustrationProps): ReactElement => (
  <div className="pointer-events-none relative aspect-[5/4] w-[78%] max-w-[640px]">
    <Sidebar spaceName={spaceName} />
    <ContentPanel variant={variant} />
  </div>
)

export default OnboardingIllustration
