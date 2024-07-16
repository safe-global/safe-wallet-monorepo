import { Alert, AlertTitle, Button, Container, Grid, Stack, Typography } from '@mui/material'
import { InvitesCard } from './invites-card'
import css from './styles.module.css'
import AlertModal from './alert-modal'
import { useState } from 'react'
import usePendingEOASRequests from '@/hooks/super-chain/usePendingEOASRequests'
import useWallet from '@/hooks/wallets/useWallet'
import { type Address, zeroAddress } from 'viem'

export type ModalContext = {
  safe: Address | null
  newOwner: Address | null
  superChainId: string | null
  isOpen: boolean
}

const initialModalContext: ModalContext = {
  isOpen: false,
  safe: null,
  newOwner: null,
  superChainId: null,
}
const AcceptInvite = () => {
  const wallet = useWallet()
  const [modalContext, setModalContext] = useState<ModalContext>(initialModalContext)
  const { data, loading: pendingEOASRequestLoading } = usePendingEOASRequests(
    (wallet?.address as Address) || zeroAddress,
  )


  return (
    <>
      <Container maxWidth="sm">
        <Grid container justifyContent="center" mt={[2, null, 2]}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h2" fontSize={24} fontWeight={600}>
                Superchain Account
              </Typography>
              <Button className={css.signUpButton} variant="contained" color="secondary">
                Sign Up
              </Button>
            </Stack>
          </Grid>
          <Grid pt={4} item xs={12}>
            <InvitesCard loading={pendingEOASRequestLoading} populations={data} setModalContext={setModalContext} />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mt: 3 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>Note</AlertTitle>
              You can cannot disconnect once you have accepted an invite to a Superchain Account.
            </Alert>
          </Grid>
        </Grid>
      </Container>
      <AlertModal modalContext={modalContext} onClose={() => setModalContext(initialModalContext)} />
    </>
  )
}
export default AcceptInvite
