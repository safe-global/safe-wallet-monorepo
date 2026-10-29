import { useEffect, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { Minus, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ShadcnProvider } from '@safe-global/views/components/ui/ShadcnProvider'
import { useAppDispatch } from '@/store'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { PLAN_OPTIONS, turnPrototypeOff, useScenario, type Scenario } from './scenario'

type Option<T> = { value: T; label: string }

const Segment = <T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}): ReactElement => (
  <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
    <span className="pr-1 text-xs text-muted-foreground">{label}</span>
    {options.map((option) => (
      <Button
        key={option.value}
        size="xs"
        variant={option.value === value ? 'default' : 'ghost'}
        role="radio"
        aria-checked={option.value === value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </Button>
    ))}
  </div>
)

const SAFE_OPTIONS: Option<Scenario['safes']>[] = [
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 12, label: '12' },
]
const ROLE_OPTIONS: Option<Scenario['role']>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]
const THEME_OPTIONS: Option<'light' | 'dark'>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const VIEWPORT_OPTIONS: Option<Scenario['viewport']>[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
]

/** Mobile view reloads the current page in a phone-sized frame; the frame follows the bar through localStorage. */
const MobileFrame = (): ReactElement => (
  <div className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-background/90 pb-24">
    <iframe
      title="Mobile view"
      src={window.location.href}
      className="h-[812px] max-h-[calc(100dvh-8rem)] w-[375px] rounded-3xl border-8 border-foreground bg-background"
    />
  </div>
)

/** Dev-only controls to click through plan states without signing in. Not rendered inside the mobile frame. */
export const ScenarioBar = (): ReactElement | null => {
  const [scenario, update] = useScenario()
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const [isTopWindow, setIsTopWindow] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    setIsTopWindow(window.self === window.top)
    // On phones the open sidebar sheet is modal, so a full bar on top of it couldn't be used anyway.
    setIsMinimized(window.matchMedia('(max-width: 767px)').matches)
  }, [])

  if (!isTopWindow) return null

  return createPortal(
    <ShadcnProvider dark={isDarkMode}>
      {scenario.viewport === 'mobile' && <MobileFrame />}
      {isMinimized ? (
        <Button
          size="xs"
          variant="outline"
          className="fixed bottom-3 right-3 z-[var(--z-overlay)]"
          onClick={() => setIsMinimized(false)}
        >
          <SlidersHorizontal aria-hidden />
          Prototype states
        </Button>
      ) : (
        <div
          role="toolbar"
          aria-label="Prototype states"
          className="fixed bottom-3 left-1/2 z-[var(--z-overlay)] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md"
          data-testid="unified-scenario-bar"
        >
          <Segment label="Plan" options={PLAN_OPTIONS} value={scenario.plan} onChange={(plan) => update({ plan })} />
          <Segment
            label="Safes"
            options={SAFE_OPTIONS}
            value={scenario.safes}
            onChange={(safes) => update({ safes })}
          />
          <Segment label="Role" options={ROLE_OPTIONS} value={scenario.role} onChange={(role) => update({ role })} />
          <Segment
            label="Theme"
            options={THEME_OPTIONS}
            value={isDarkMode ? 'dark' : 'light'}
            onChange={(theme) => dispatch(setDarkMode(theme === 'dark'))}
          />
          <Segment
            label="View"
            options={VIEWPORT_OPTIONS}
            value={scenario.viewport}
            onChange={(viewport) => update({ viewport })}
          />
          <Button size="xs" variant="ghost" onClick={() => setIsMinimized(true)} aria-label="Minimise">
            <Minus aria-hidden />
          </Button>
          <Button size="xs" variant="ghost" onClick={turnPrototypeOff} aria-label="Turn the prototype off">
            <X aria-hidden />
          </Button>
        </div>
      )}
    </ShadcnProvider>,
    document.body,
  )
}
