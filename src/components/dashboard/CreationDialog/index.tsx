import React, { type ElementType } from 'react'
import { Box, Button, Dialog, DialogContent, Grid, SvgIcon, Typography } from '@mui/material'
import { useRouter } from 'next/router'

import HomeIcon from '@/public/images/sidebar/home.svg'
import TransactionIcon from '@/public/images/sidebar/transactions.svg'
import AppsIcon from '@/public/images/sidebar/apps.svg'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import BeamerIcon from '@/public/images/sidebar/whats-new.svg'
import HelpCenterIcon from '@/public/images/sidebar/help-center.svg'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import { useCurrentChain } from '@/hooks/useChains'
import { CREATION_MODAL_QUERY_PARAM } from '@/components/new-safe/create/logic'

const HintItem = ({ Icon, title, description }: { Icon: ElementType; title: string; description: string }) => {
  return (
    <Grid item md={6}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <SvgIcon component={Icon} inheritViewBox fontSize="small" />
        <Typography variant="subtitle2" fontWeight="700">
          {title}
        </Typography>
      </Box>

      <Typography variant="body2">{description}</Typography>
    </Grid>
  )
}

const CreationDialog = () => {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)
  const [remoteSafeApps = []] = useRemoteSafeApps()
  const chain = useCurrentChain()

  const onClose = () => {
    const { [CREATION_MODAL_QUERY_PARAM]: _, ...query } = router.query
    router.replace({ pathname: router.pathname, query })

    setOpen(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent sx={{ paddingX: 8, paddingTop: 9, paddingBottom: 6 }}>
        <Typography variant="h3" fontWeight="700" mb={1}>
          Welcome to {'Safe{Wallet}'}!
        </Typography>
        <Typography variant="body2">
          Congratulations on your first step to truly unlock ownership. Enjoy the experience and discover our app.
        </Typography>

        <Grid container mt={2} mb={4} spacing={3}>
          <HintItem Icon={HomeIcon} title="Home" description="Get a status overview of your Safe Account here." />
          <HintItem
            Icon={TransactionIcon}
            title="Transactions"
            description="Review, approve, execute and keep track of asset movement."
          />
          <HintItem
            Icon={AppsIcon}
            title="Apps"
            description={`Over ${remoteSafeApps.length} dApps available for you on ${chain?.chainName}.`}
          />
          <HintItem
            Icon={SettingsIcon}
            title="Settings"
            description="Want to change your Safe Account setup? Settings is the right place to go."
          />
          <HintItem Icon={BeamerIcon} title="What's new" description="Don't miss any future Safe updates." />
          <HintItem
            Icon={HelpCenterIcon}
            title="Help center"
            description="Have any questions? Check out our collection of articles."
          />
        </Grid>

        <Box display="flex" justifyContent="center">
          <Button data-testid="dialog-confirm-btn" onClick={onClose} variant="contained" size="stretched">
            Got it
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default CreationDialog
