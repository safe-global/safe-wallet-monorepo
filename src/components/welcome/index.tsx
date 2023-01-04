import React from 'react'
import {
  Button,
  Grid,
  Paper,
  SvgIcon,
  Typography,
  ButtonBase,
  Box,
  AccordionSummary,
  AccordionDetails,
  Accordion,
} from '@mui/material'
import { useRouter } from 'next/router'
import { CREATE_SAFE_EVENTS, LOAD_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import Track from '../common/Track'
import { AppRoutes } from '@/config/routes'
import SafeList from '@/components/sidebar/SafeList'
import css from './styles.module.css'
import NewSafeIcon from '@/public/images/welcome/new-safe.svg'
import LoadSafeIcon from '@/public/images/welcome/load-safe.svg'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import Keyhole from '@/components/common/icons/KeyholeIcon/keyhole.svg'
import CircularIcon from '@/components/common/icons/CircularIcon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const NewSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const connectWallet = useConnectWallet()

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4} lg={3.5}>
        <Accordion className={css.accordion} defaultExpanded={false} sx={{ display: { xs: 'block', md: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h4" display="inline" fontWeight={700}>
              My Safes
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ padding: 0 }}>
            <div className={css.sidebar}>
              <SafeList closeDrawer={() => {}} />
            </div>
          </AccordionDetails>
        </Accordion>
        <Box className={css.sidebar} display={{ xs: 'none', md: 'block' }}>
          <SafeList closeDrawer={() => {}} />
        </Box>
      </Grid>
      <Grid item xs={12} md={8} lg={8.5}>
        <div className={css.content}>
          <Typography
            variant="h1"
            fontSize={[44, null, 52]}
            lineHeight={1}
            letterSpacing={-1.5}
            color="static.main"
            mb={1}
          >
            Welcome to the Safe
          </Typography>
          <Typography mb={5} color="static.main">
            The most trusted decentralized custody protocol and collective asset management platform.
          </Typography>
          {wallet ? (
            <Grid container spacing={3} sx={{ maxWidth: '800px' }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ padding: 4, height: 1 }}>
                  <SvgIcon component={NewSafeIcon} inheritViewBox sx={{ width: '42px', height: '42px' }} />
                  <Typography variant="h3" fontWeight={700} mb={1} mt={3}>
                    Create Safe
                  </Typography>
                  <Typography variant="body2" mb={3}>
                    A new Safe that is controlled by one or multiple owners.
                  </Typography>
                  <Track {...CREATE_SAFE_EVENTS.CREATE_BUTTON}>
                    <Button variant="contained" onClick={() => router.push(AppRoutes.newSafe.create)}>
                      + Create new Safe
                    </Button>
                  </Track>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ padding: 4, height: 1 }}>
                  <SvgIcon component={LoadSafeIcon} inheritViewBox sx={{ width: '42px', height: '42px' }} />
                  <Typography variant="h3" fontWeight={700} mb={1} mt={3}>
                    Add existing Safe
                  </Typography>
                  <Typography variant="body2" mb={3}>
                    Already have a Safe? Add your Safe using your Safe address.
                  </Typography>
                  <Track {...LOAD_SAFE_EVENTS.LOAD_BUTTON}>
                    <Button variant="outlined" onClick={() => router.push(AppRoutes.newSafe.load)}>
                      Add existing Safe
                    </Button>
                  </Track>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <ButtonBase className={css.button} onClick={connectWallet} disableRipple>
              <Box display="flex" alignItems="center" gap={2} textAlign="left">
                <CircularIcon icon={Keyhole} size={40} />
                <Typography variant="h4" fontWeight={700}>
                  Connect wallet to start using Safe
                </Typography>
              </Box>
            </ButtonBase>
          )}
        </div>
      </Grid>
    </Grid>
  )
}

export default NewSafe
