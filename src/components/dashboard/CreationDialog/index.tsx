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
          Welcome to Super Account!
        </Typography>
        <Typography variant="body2">
          With this Super Account, you will be able to explore and contribute to the Superchain through the following
          features:
        </Typography>

        <Grid container mt={2} mb={4} spacing={3}>
          <HintItem
            Icon={AccountIcon}
            title="Account"
            description="Connect your Superchain Wallets to your Super Account to track your progress."
          />
          <HintItem
            Icon={BadgesIcon}
            title="Badges"
            description="Earn Superchain progress badges based on the accomplishment of all your connected wallets."
          />
          <HintItem
            Icon={LeaderBoardIcon}
            title="Leaderboard"
            description="Earn Superchain Points to climb the Leaderboard and become the top Super Contributor."
          />
          <HintItem
            Icon={TransactionIcon}
            title="Transactions"
            description="Benefit from Super Account perks, which include several weekly free transactions based on your account level."
          />
          <HintItem
            Icon={ContactsIcon}
            title="Contacts"
            description="Keep all your addresses and contacts in one spot."
          />
          <HintItem
            Icon={AppsIcon}
            title="Apps"
            description="Use native Super Account apps to benefit from special perks or engage with any app through Wallet connect."
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
        Enter Account
      </Button>
    </Dialog>
  )
}

export default CreationDialog
