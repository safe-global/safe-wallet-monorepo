import { AppRoutes } from '@/config/routes'
import { Paper, Typography, Divider, Box, Button, Stack, Tooltip, SvgIcon } from '@mui/material'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import useWallet from '@/hooks/wallets/useWallet'
import { useCallback, useEffect, useState } from 'react'
import InfoIcon from '@/public/images/common/info.svg'
import useCurrentWalletHasSuperChainSmartAccount from '@/hooks/super-chain/useCurrentWalletHasSuperChainSmartAccount'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
const WelcomeLogin = () => {
  const router = useRouter()
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()
  const wallet = useWallet()
  const { hasSuperChainSmartAccount, superChainSmartAccount, isLoading, refetch, isRefetching } =
    useCurrentWalletHasSuperChainSmartAccount()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState<null | string>(null)
  const onLogin = useCallback(async () => {
    setShouldRedirect(true)
  }, [])

  const handleConnect = async () => {
    open()
    await onLogin()
  }

  const handleAcceptInvite = async () => {
    setRedirectPath(AppRoutes.invites)
    if (wallet) {
      await onLogin()
    } else {
      handleConnect()
    }
  }

  useEffect(() => {
    if (!shouldRedirect || !isConnected || isRefetching || isLoading || !wallet) return
    ;(async () => {
      await refetch()

      const destination = redirectPath
        ? { pathname: redirectPath, query: router.query }
        : !hasSuperChainSmartAccount
        ? { pathname: AppRoutes.newSafe.create, query: router.query }
        : { pathname: AppRoutes.home, query: { safe: superChainSmartAccount } }

      if (destination) {
        router.push(destination)
        setShouldRedirect(false)
      }
    })()
  }, [hasSuperChainSmartAccount, isLoading, router, isConnected, shouldRedirect, redirectPath, isRefetching, wallet])

  return (
    <Paper className={css.loginCard} data-testid="welcome-login">
      <Box className={css.loginContent}>
        <Box className={css.loginContent}>
          <Typography variant="h6" mt={6} fontWeight={700}>
            Welcome
          </Typography>

          <Typography mb={2} textAlign="center">
            Log in to an existing Super Account or Sign Up to create your Super Account.
          </Typography>
          <Stack direction="row" gap={2}>
            <Button onClick={handleConnect} variant="contained" disableElevation size="medium">
              Connect Wallet
            </Button>
          </Stack>
          <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
            <Typography color="text.secondary" fontWeight={700} variant="overline">
              OR
            </Typography>
          </Divider>
          <Tooltip
            placement="bottom"
            title={
              <Typography align="center">Accept an invitation to add an extra Wallet to your Super Account.</Typography>
            }
          >
            <Button
              endIcon={<SvgIcon fontSize="inherit" component={InfoIcon} inheritViewBox />}
              onClick={handleAcceptInvite}
              variant="outlined"
              disableElevation
              size="medium"
            >
              Accept invite
            </Button>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  )
}

export default WelcomeLogin
