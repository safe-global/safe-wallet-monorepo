import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setDarkMode } from '@/store/settingsSlice'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

type ThemeOption = {
  value: 'light' | 'dark' | 'system'
  label: string
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

const getCurrentTheme = (darkMode: boolean | undefined): ThemeOption['value'] => {
  if (darkMode === true) return 'dark'
  if (darkMode === false) return 'light'
  return 'system'
}

const AppearanceSection = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const current = getCurrentTheme(settings.theme.darkMode)

  const handleChange = (value: ThemeOption['value']) => {
    if (value === current) return
    const nextDarkMode = value === 'dark' ? true : value === 'light' ? false : undefined
    dispatch(setDarkMode(nextDarkMode))
    trackEvent({ ...SETTINGS_EVENTS.APPEARANCE.DARK_MODE, label: value })
  }

  return (
    <section className="bg-card rounded-2xl p-6 mb-3">
      <Typography variant="paragraph-bold" className="mb-5 block tracking-tight">
        Appearance
      </Typography>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground">Theme</Label>
        <div aria-label="Theme" className="flex flex-col sm:flex-row gap-2">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = current === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleChange(opt.value)}
                data-testid={`theme-card-${opt.value}`}
                className={cn(
                  'flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  isSelected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground dark:bg-accent dark:text-primary'
                    : 'bg-muted hover:bg-muted/70',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'h-4 w-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0',
                    isSelected ? 'border-sidebar-accent-foreground dark:border-primary' : 'border-muted-foreground',
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-sidebar-accent-foreground dark:bg-primary" />}
                </span>
                <Typography variant="paragraph-small-bold">{opt.label}</Typography>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default AppearanceSection
