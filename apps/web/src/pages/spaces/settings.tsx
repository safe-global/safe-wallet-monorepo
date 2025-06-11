import { useRouter } from 'next/router'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import SpaceSettings from 'src/features/spaces/components/SpaceSettings'
import AuthState from '@/features/spaces/components/AuthState'
import { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import Pro from '@/components/pro'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export default function SpaceSettingsPage() {
  const router = useRouter()
  const { spaceId } = router.query
  const [value, setValue] = useState(0)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  if (!router.isReady || !spaceId || typeof spaceId !== 'string') return null

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Space settings`}</title>
      </Head>

      <main>
        <AuthState spaceId={spaceId}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Space settings" {...a11yProps(0)} />
                <Tab label="Manage subscription" {...a11yProps(1)} />
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <SpaceSettings />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <Pro />
            </CustomTabPanel>
          </Box>
        </AuthState>
      </main>
    </>
  )
}
