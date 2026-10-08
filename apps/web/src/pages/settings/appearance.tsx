import { useId } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { useAppDispatch } from '@/store'
import { setDarkMode } from '@/store/settingsSlice'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { useDarkMode } from '@/hooks/useDarkMode'
import { BRAND_NAME } from '@/config/constants'
import { AppearanceView } from '@views/pages/settings/AppearanceView'

const Appearance: NextPage = () => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const darkModeId = useId()

  const handleDarkModeToggle = (checked: boolean) => {
    dispatch(setDarkMode(checked))

    trackEvent({
      ...SETTINGS_EVENTS.APPEARANCE.DARK_MODE,
      label: checked,
    })
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Appearance`}</title>
      </Head>
      <SettingsHeader />
      <AppearanceView darkModeId={darkModeId} isDarkMode={isDarkMode} onDarkModeToggle={handleDarkModeToggle} />
    </>
  )
}

export default Appearance
