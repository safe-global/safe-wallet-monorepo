import { Alert, AlertTitle, Button, Container, Grid, Stack, Typography } from '@mui/material'
import { InvitesCard } from './invites-card'
import css from './styles.module.css'
import AlertModal from './alert-modal'
import { useState } from 'react'
const AcceptInvite = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
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
            <InvitesCard setIsModalOpen={setIsModalOpen} />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mt: 3 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>Note</AlertTitle>
              You can cannot disconnect once you have accepted an invite to a Superchain Account.
            </Alert>
          </Grid>
        </Grid>
      </Container>
      <AlertModal open={true} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
export default AcceptInvite
