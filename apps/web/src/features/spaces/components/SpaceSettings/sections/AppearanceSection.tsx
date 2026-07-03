import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setDarkMode } from '@/store/settingsSlice'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import SpaceSettingsSection, { SpaceSettingsSectionTitle } from '../SpaceSettingsSection'

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
    <SpaceSettingsSection>
      <SpaceSettingsSectionTitle>Appearance</SpaceSettingsSectionTitle>

      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground">Theme</Label>
        <div aria-label="Theme" className="flex flex-col sm:flex-row gap-2">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = current === opt.value
            return (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                aria-pressed={isSelected}
                onClick={() => handleChange(opt.value)}
                data-testid={`theme-card-${opt.value}`}
                className={cn(
                  'flex h-auto flex-1 justify-start gap-3 whitespace-normal rounded-lg px-4 py-3 text-left font-normal',
                  isSelected
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent dark:bg-accent dark:text-primary dark:hover:bg-accent'
                    : 'bg-muted hover:bg-muted/70',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-sidebar-accent-foreground dark:border-primary' : 'border-muted-foreground',
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-sidebar-accent-foreground dark:bg-primary" />}
                </span>
                <Typography variant="paragraph-small-bold">{opt.label}</Typography>
              </Button>
            )
          })}
        </div>
      </div>
    </SpaceSettingsSection>
  )
}

export default AppearanceSection
