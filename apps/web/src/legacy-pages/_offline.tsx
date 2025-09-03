import { Box, Paper, Typography } from '@mui/material'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const Offline: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Offline`}</title>
      </Head>

      <main>
        <Box display="flex" justifyContent="center">
          <Paper sx={{ p: 4, mb: 2, maxWidth: 900 }}>
            <Box display="flex" justifyContent="center" mb={2} fontSize={100}>
              <WifiOffIcon fontSize="inherit" />
            </Box>

            <Typography variant="h1" textAlign="center">
              Oops, it looks like you&apos;re offline!
            </Typography>

            <Typography variant="body1" mt={3}>
              We apologize, but it looks like you are currently unable to access our app due to an offline connection.
            </Typography>

            <Typography variant="body1" mt={2}>
              While you wait for your internet to come back online, we encourage you to take a moment to step outside
              and enjoy the nature. If you have the opportunity, try touching the grass with your bare feet -
              there&apos;s something about the sensation of grass on our skin that can be really grounding and
              refreshing.
            </Typography>

            <Typography variant="body1" mt={2}>
              We hope to see you back online soon. Thank you for your patience.
            </Typography>
          </Paper>
        </Box>
      </main>
    </>
  )
}

export default Offline
