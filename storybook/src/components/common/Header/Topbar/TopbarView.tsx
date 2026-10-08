import type { ComponentType, ReactElement, ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { cn } from '@/utils/cn'

export const SEARCH_CONTEXT_HEIGHT = 'h-14'
export const SAFE_BAR_CONTEXT_HEIGHT = 'min-h-14'
export const SEARCH_CONTEXT_WRAP = '@max-[660px]:basis-full'
export const SAFE_BAR_CONTEXT_WRAP = '@max-[1150px]:order-last @max-[1150px]:basis-full'

export type TopbarViewProps = {
  showLogo: boolean
  showSpaceSafeBar: boolean
  showMenuButton: boolean
  onMenuClick: () => void
  logo: ReactNode
  safeBar: ReactNode
  SearchInput: ComponentType<{ className?: string }>
  safenetStaking?: ReactNode
  navigation: ReactNode
  accountInfo: ReactNode
}

export function TopbarView({
  showLogo,
  showSpaceSafeBar,
  showMenuButton,
  onMenuClick,
  logo,
  safeBar,
  SearchInput,
  safenetStaking,
  navigation,
  accountInfo,
}: TopbarViewProps): ReactElement {
  const contextWrap = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_CONTEXT_WRAP : SEARCH_CONTEXT_WRAP
  const contextHeight = showLogo ? undefined : showSpaceSafeBar ? SAFE_BAR_CONTEXT_HEIGHT : SEARCH_CONTEXT_HEIGHT

  return (
    <header
      className={cn(
        '@container flex flex-wrap gap-y-2 px-6 pt-6 pb-4 bg-secondary dark:bg-background',
        showLogo ? 'items-center' : 'items-start',
        showMenuButton && 'pl-2',
      )}
    >
      {showMenuButton ? (
        <Button variant="ghost" size="icon" className="mr-2" onClick={onMenuClick} aria-label="Open sidebar menu">
          <Menu className="size-5" strokeWidth={ICON_STROKE} />
        </Button>
      ) : null}

      <div className={cn('mr-auto shrink-0 flex items-center', contextHeight, contextWrap)}>
        {showLogo ? logo : showSpaceSafeBar ? safeBar : <SearchInput className="h-full w-64 rounded-3xl md:w-80" />}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        {safenetStaking && <div className="hidden sm:block">{safenetStaking}</div>}

        {navigation}

        {accountInfo}
      </div>
    </header>
  )
}
