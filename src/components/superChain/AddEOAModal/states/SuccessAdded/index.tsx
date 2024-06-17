import { Box, Button, Dialog, DialogContent, Stack, SvgIcon, Typography } from '@mui/material'
import css from './styles.module.css'
import React from 'react'
import InviteSent from '@/public/images/common/invite-sent.svg'
import { useRouter } from 'next/router'
import { usePrivy } from '@privy-io/react-auth'

function SuccessAdded({ onClose, context }: { onClose: () => void; context: any }) {
  const router = useRouter()
  const { logout } = usePrivy()
  const onRedirectLogInScreen = async () => {
    await logout()
    router.push('/welcome')
  }
  return (
    <Dialog className={css.claimModal} open={context.open} onClose={onClose}>
      <DialogContent>
        <Stack justifyContent="center" alignItems="center" gap="24px" padding="36px 24px 36px 24px">
          <Box fontSize={56} height={47} width={55}>
            <SvgIcon component={InviteSent} inheritViewBox fontSize="inherit" />
          </Box>
          <Typography fontWeight={600} fontSize={24} align="center">
            Invite sent!
          </Typography>
          <Typography fontWeight={400} fontSize={16} color="text.secondary" variant="body1" align="center">
            You can find the invite on the login screen on the invited address{' '}
          </Typography>
        </Stack>
      </DialogContent>
      <Box display="flex" flexDirection="row" className={css.outsideActions}>
        <Button fullWidth variant="contained" color="background" onClick={onRedirectLogInScreen}>
          LogIn Screen
        </Button>

        <Button onClick={onClose} fullWidth variant="contained" color="primary" type="submit">
          Continue
        </Button>
      </Box>
    </Dialog>
  )
}

export default SuccessAdded
