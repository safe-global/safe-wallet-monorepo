import { useId } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setCopyShortName, setDarkMode } from '@/store/settingsSlice'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { BRAND_NAME } from '@/config/constants'

const Appearance: NextPage = () => {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const isDarkMode = useDarkMode()
  const copyPrefixId = useId()
  const darkModeId = useId()

  const handleToggle = (
    action: typeof setCopyShortName | typeof setDarkMode,
    event: typeof SETTINGS_EVENTS.APPEARANCE.COPY_PREFIXES | typeof SETTINGS_EVENTS.APPEARANCE.DARK_MODE,
  ) => {
    return (checked: boolean) => {
      dispatch(action(checked))

      trackEvent({
        ...event,
        label: checked,
      })
    }
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Appearance`}</title>
      </Head>
      <SettingsHeader />
      <main>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Chain-specific addresses</Typography>
            </div>

            <div>
              <Typography className="mb-4">
                Choose whether to copy{' '}
                <ExternalLink href="https://eips.ethereum.org/EIPS/eip-3770">EIP-3770</ExternalLink> prefixes when
                copying Ethereum addresses.
              </Typography>
              <Field orientation="horizontal">
                <Checkbox
                  id={copyPrefixId}
                  checked={settings.shortName.copy}
                  onCheckedChange={handleToggle(setCopyShortName, SETTINGS_EVENTS.APPEARANCE.COPY_PREFIXES)}
                />
                <FieldLabel htmlFor={copyPrefixId}>Copy addresses with chain prefix</FieldLabel>
              </Field>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Theme</Typography>
            </div>

            <div>
              <Field orientation="horizontal">
                <Switch
                  id={darkModeId}
                  checked={isDarkMode}
                  onCheckedChange={handleToggle(setDarkMode, SETTINGS_EVENTS.APPEARANCE.DARK_MODE)}
                />
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
