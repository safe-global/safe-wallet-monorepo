import type { NextPage } from 'next'
import Head from 'next/head'
import { Grid, Paper, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import { ContractVersion } from '@/components/settings/ContractVersion'
import { OwnerList } from '@/components/settings/owner/OwnerList'
import { RequiredConfirmation } from '@/components/settings/RequiredConfirmations'
import useSafeInfo from '@/hooks/useSafeInfo'
import SettingsHeader from '@/components/settings/SettingsHeader'
import DelegatesList from '@/components/settings/DelegatesList'

const Setup: NextPage = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const nonce = safe.nonce
  const ownerLength = safe.owners.length
  const threshold = safe.threshold

  return (
    <>
      <Head>
        <title>{'SuperChain SA – Settings – Setup'}</title>
      </Head>

      <SettingsHeader />

      <main>
        <Paper data-testid="setup-section" sx={{ p: 4, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item lg={4} xs={12}>
              <Typography variant="h4" fontWeight={700}>
                <Tooltip
                  placement="top"
                  title="For security reasons, transactions made with a Safe Account need to be executed in order. The nonce shows you which transaction will be executed next. You can find the nonce for a transaction in the transaction details."
                >
                  <span>
                    Safe Account nonce
                    <SvgIcon
                      component={InfoIcon}
                      inheritViewBox
                      fontSize="small"
                      color="border"
                      sx={{ verticalAlign: 'middle', ml: 0.5 }}
                    />
                  </span>
                </Tooltip>
              </Typography>

              <Typography pt={1}>
                Current nonce:{' '}
                {safeLoaded ? <b>{nonce}</b> : <Skeleton width="30px" sx={{ display: 'inline-block' }} />}
              </Typography>
            </Grid>

            <Grid item xs>
              <ContractVersion />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <OwnerList />

          <RequiredConfirmation threshold={threshold} owners={ownerLength} />
        </Paper>

        <DelegatesList />
      </main>
    </>
  )
}

export default Setup
