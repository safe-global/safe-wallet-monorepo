import React, { type ElementType } from 'react'
import { Box, Button, Dialog, DialogContent, Grid, SvgIcon, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import css from './styles.module.css'

import AccountIcon from '@/public/images/sidebar/account.svg'
import BadgesIcon from '@/public/images/sidebar/badges.svg'
import ContactsIcon from '@/public/images/sidebar/contacts.svg'
import AppsIcon from '@/public/images/sidebar/apps.svg'
import TransactionIcon from '@/public/images/sidebar/transactions.svg'
import LeaderBoardIcon from '@/public/images/sidebar/leaderboard.svg'
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
    <Dialog className={css.creationModal} open={open}>
      <DialogContent sx={{ padding: 0 }}>
        <Typography variant="h3" fontWeight="700" mb={1}>
          Welcome to Superchain Account!
        </Typography>
        <Typography variant="body2">
          Congrats on your new account. Here are some of the key feature of the Superchain account:
        </Typography>

        <Grid container mt={2} mb={4} spacing={3}>
          <HintItem
            Icon={AccountIcon}
            title="Account"
            description="Review, approve, execute and keep track of asset movement."
          />
          <HintItem
            Icon={BadgesIcon}
            title="Badges"
            description="Keep track of your progress andd stay up to date on the latest tasks."
          />
          <HintItem
            Icon={LeaderBoardIcon}
            title="Leaderboard"
            description="Climb the leaderboard and get to the top of the Superchain."
          />
          <HintItem
            Icon={TransactionIcon}
            title="Transactions"
            description="Receive, send and manage all your Superchain transactions in one place."
          />
          <HintItem
            Icon={ContactsIcon}
            title="Contacts"
            description="Keep all your address and contacts in one spot."
          />
          <HintItem
            Icon={AppsIcon}
            title="Apps"
            description="Receive, send and manage all your Superchain transactions in one place."
          />
        </Grid>
      </DialogContent>
      <Button
        className={css.outsideButton}
        data-testid="dialog-confirm-btn"
        fullWidth
        onClick={onClose}
        variant="contained"
      >
        Got it
      </Button>
    </Dialog>
  )
}

export default CreationDialog
