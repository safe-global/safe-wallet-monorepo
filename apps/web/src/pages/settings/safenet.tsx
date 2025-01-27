import SettingsHeader from '@/components/settings/SettingsHeader'
import { BRAND_NAME } from '@/config/constants'
import { useHasSafenetFeature } from '@/features/safenet/hooks/useHasSafenetFeature'
import { Typography } from '@mui/material'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const LazySafenetPage = dynamic(() => import('@/features/safenet/components/SafenetPage'), { ssr: false })

const SafenetPage: NextPage = () => {
  const hasSafenetFeature = useHasSafenetFeature()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Safenet`}</title>
      </Head>

      <SettingsHeader />

      {hasSafenetFeature === true ? (
        <LazySafenetPage />
      ) : hasSafenetFeature === false ? (
        <main>
          <Typography textAlign="center" my={3}>
            Safenet is not available on this network.
          </Typography>
        </main>
      ) : null}
    </>
  )
}

export default SafenetPage
