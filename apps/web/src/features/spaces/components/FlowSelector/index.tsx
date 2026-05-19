import { useState, useEffect, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

export type FlowType = 'existing-has-safes-no-spaces' | 'existing-has-safes-has-spaces' | 'new-user' | 'v2-feedback' | 'v2-light-panel'
export type BannerStyle = 'filled' | 'minimal'

const FLOWS: { id: FlowType; label: string; description: string; entryRoute: string }[] = [
  {
    id: 'existing-has-safes-no-spaces',
    label: 'Existing user, has Safes, no Workspaces',
    description: 'Welcome → connect wallet → create workspace flow',
    entryRoute: AppRoutes.welcome.spaces,
  },
  {
    id: 'existing-has-safes-has-spaces',
    label: 'Existing user, has Safes, has Workspaces',
    description: 'Welcome → connect wallet → workspace dashboard',
    entryRoute: AppRoutes.welcome.spaces,
  },
  {
    id: 'new-user',
    label: 'New user',
    description: 'Welcome → creation flow → empty workspace view',
    entryRoute: AppRoutes.welcome.spaces,
  },
  {
    id: 'v2-feedback',
    label: 'v2 — team feedback',
    description: 'Simpler copy, bigger promo card, 2-col use cases, no toasts',
    entryRoute: AppRoutes.welcome.spaces,
  },
  {
    id: 'v2-light-panel',
    label: 'v2 — light mode panel',
    description: 'Same as v2 but popup illustration in light mode',
    entryRoute: AppRoutes.welcome.spaces,
  },
]

const FLOW_STORAGE_KEY = 'safe-onboarding-flow-type'
const BANNER_STORAGE_KEY = 'safe-onboarding-banner-style'

export const getActiveFlow = (): FlowType => {
  if (typeof window === 'undefined') return 'existing-has-safes-no-spaces'
  return (localStorage.getItem(FLOW_STORAGE_KEY) as FlowType) || 'existing-has-safes-no-spaces'
}

export const setActiveFlow = (flow: FlowType) => {
  localStorage.setItem(FLOW_STORAGE_KEY, flow)
}

export const isV2Flow = (): boolean => {
  const flow = getActiveFlow()
  return flow === 'v2-feedback' || flow === 'v2-light-panel'
}

export const isLightPanelFlow = (): boolean => getActiveFlow() === 'v2-light-panel'

export const getBannerStyle = (): BannerStyle => {
  if (typeof window === 'undefined') return 'filled'
  return (localStorage.getItem(BANNER_STORAGE_KEY) as BannerStyle) || 'filled'
}

export const setBannerStyle = (style: BannerStyle) => {
  localStorage.setItem(BANNER_STORAGE_KEY, style)
}

const DEFAULT_FLOW: FlowType = 'existing-has-safes-no-spaces'
const DEFAULT_BANNER: BannerStyle = 'filled'

const BANNER_OPTIONS: { id: BannerStyle; label: string }[] = [
  { id: 'filled', label: 'Filled background' },
  { id: 'minimal', label: 'No background' },
]

const FlowSelector = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFlow, setActiveFlowState] = useState<FlowType>(DEFAULT_FLOW)
  const [activeBanner, setActiveBannerState] = useState<BannerStyle>(DEFAULT_BANNER)
  const router = useRouter()
  const isDarkMode = useDarkMode()

  // Read from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setActiveFlowState(getActiveFlow())
    setActiveBannerState(getBannerStyle())
  }, [])

  const handleSelect = (flow: (typeof FLOWS)[number]) => {
    setActiveFlowState(flow.id)
    setActiveFlow(flow.id)
    router.push(flow.entryRoute)
  }

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="fixed bottom-0 right-4 z-50 w-[420px]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-t-xl border border-b-0 border-border bg-background px-5 py-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-foreground">
              Flow: {FLOWS.find((f) => f.id === activeFlow)?.label}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <div className="border border-t-0 border-border bg-background px-3 pb-3 shadow-lg">
            <div className="flex flex-col gap-1">
              {FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => handleSelect(flow)}
                  className={cn(
                    'flex flex-col items-start rounded-lg px-4 py-3 text-left transition-colors',
                    activeFlow === flow.id
                      ? 'bg-[var(--sidebar-accent)]'
                      : 'hover:bg-secondary',
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{flow.label}</span>
                  <span className="text-xs text-muted-foreground">{flow.description}</span>
                </button>
              ))}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <span className="px-4 text-xs font-medium text-muted-foreground">Banner style</span>
              <div className="mt-1 flex flex-col gap-1">
                {BANNER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setActiveBannerState(opt.id)
                      setBannerStyle(opt.id)
                      window.location.reload()
                    }}
                    className={cn(
                      'rounded-lg px-4 py-2 text-left text-sm transition-colors',
                      activeBanner === opt.id
                        ? 'bg-[var(--sidebar-accent)] font-medium text-foreground'
                        : 'text-foreground hover:bg-secondary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlowSelector
