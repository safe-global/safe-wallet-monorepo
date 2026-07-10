import { FormControlLabel, Grid, Paper, Typography, Switch } from '@mui/material'
import type { ChangeEvent } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { useAppDispatch } from '@/store'
import { setDarkMode } from '@/store/settingsSlice'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import { useDarkMode } from '@/hooks/useDarkMode'
import { BRAND_NAME } from '@/config/constants'

const Appearance: NextPage = () => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()

  const handleDarkModeToggle = (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
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
        <Paper sx={{ p: 4 }}>
          <Grid
            container
            spacing={3}
            sx={{
              alignItems: 'center',
            }}
          >
            <Grid item lg={4} xs={12}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                Theme
              </Typography>
            </Grid>

            <Grid item xs>
              <FormControlLabel
                control={<Switch checked={isDarkMode} onChange={handleDarkModeToggle} />}
                label="Dark mode"
              />
            </Grid>
          </Grid>
        </Paper>
      </main>
    </>
  )
}

export default Appearance
