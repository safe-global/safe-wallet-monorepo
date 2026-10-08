import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setDarkMode } from '@/store/settingsSlice'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import {
  AppearanceSectionView,
  type ThemeValue,
} from '@views/features/spaces/components/SpaceSettings/sections/AppearanceSectionView'

const getCurrentTheme = (darkMode: boolean | undefined): ThemeValue => {
  if (darkMode === true) return 'dark'
  if (darkMode === false) return 'light'
  return 'system'
}

const AppearanceSection = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const current = getCurrentTheme(settings.theme.darkMode)

  const handleChange = (value: ThemeValue) => {
    if (value === current) return
    const nextDarkMode = value === 'dark' ? true : value === 'light' ? false : undefined
    dispatch(setDarkMode(nextDarkMode))
    trackEvent({ ...SETTINGS_EVENTS.APPEARANCE.DARK_MODE, label: value })
  }

  return <AppearanceSectionView current={current} onChange={handleChange} />
}

export default AppearanceSection
