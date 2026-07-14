import { useId } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import { useAppDispatch } from '@/store'
import { setDarkMode } from '@/store/settingsSlice'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { useDarkMode } from '@/hooks/useDarkMode'
import { BRAND_NAME } from '@/config/constants'

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
      <main>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Theme</Typography>
            </div>

            <div>
              <Field orientation="horizontal">
                <Switch id={darkModeId} checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
                <FieldLabel htmlFor={darkModeId}>Dark mode</FieldLabel>
              </Field>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Appearance
