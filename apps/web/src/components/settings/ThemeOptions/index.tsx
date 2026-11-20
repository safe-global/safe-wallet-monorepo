import ThemeOptionsView from '@safe-global/views/components/settings/ThemeOptions'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectAppearanceTheme, setAppearanceTheme, type AppearanceTheme } from '@/store/settingsSlice'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
  { value: 'gta6', label: 'GTA VI' },
] satisfies { value: AppearanceTheme; label: string }[]

const ThemeOptions = () => {
  const dispatch = useAppDispatch()
  const current = useAppSelector(selectAppearanceTheme)

  const handleChange = (value: AppearanceTheme) => {
    if (value === current) return
    dispatch(setAppearanceTheme(value))
    trackEvent({ ...SETTINGS_EVENTS.APPEARANCE.DARK_MODE, label: value })
  }

  return <ThemeOptionsView options={THEME_OPTIONS} current={current} onChange={handleChange} />
}

export default ThemeOptions
