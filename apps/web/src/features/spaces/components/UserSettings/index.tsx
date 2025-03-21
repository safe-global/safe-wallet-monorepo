import { Box, Typography, Card, Stack, Button, SvgIcon, IconButton } from '@mui/material'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useEffect } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import LinkIcon from '@/public/images/messages/link.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import css from './styles.module.css'
import InfoBox from '@/components/safe-messages/InfoBox'

const UserSettings = () => {
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: user, isError } = useUsersGetWithWalletsV1Query()

  useEffect(() => {
    if (isUserSignedIn && (isError || !user)) {
      router.push(AppRoutes['404'])
    }
  }, [isUserSignedIn, isError, user, router])

  return (
    <Box className={css.container}>
      <Box className={css.userSettings}>
        <Typography variant="h1" mb={3} align="center">
          Manage Wallets
        </Typography>

        <Card sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h3" fontWeight="bold">
              Linked wallets
            </Typography>
            <Typography variant="body1">
              A linked wallet allows you to sign in to your Safe Spaces while keeping all your data, such as account
              names and team members, consistent across all linked wallets.
            </Typography>

            <Box>
              {user?.wallets.map((wallet) => (
                <Stack
                  direction="row"
                  spacing={2}
                  key={wallet.address}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <EthHashInfo shortAddress={false} address={wallet.address} showCopyButton hasExplorer />
                  <IconButton onClick={() => {}} size="small">
                    <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" sx={{ m: 1 }} />
                  </IconButton>
                </Stack>
              ))}
            </Box>
            <Button
              startIcon={<SvgIcon component={LinkIcon} inheritViewBox fontSize="medium" className={css.linkIcon} />}
              variant="text"
              color="primary"
              sx={{ width: 'fit-content', p: 1 }}
            >
              Link another wallet
            </Button>
            <InfoBox
              title="How to link a wallet?"
              message={
                <>
                  <div className={css.steps}>
                    {[
                      'Add an address to your profile and confirm with a signature.',
                      'Sign in with the new address and confirm again',
                      'Your wallet now shares the same profile data!',
                    ].map((stepText, index) => (
                      <Typography key={index} className={css.step} variant="body1" display="flex" gap={1}>
                        <Box component="span" className={css.stepNumber}>
                          {index + 1}
                        </Box>
                        {stepText}
                      </Typography>
                    ))}
                  </div>
                </>
              }
            ></InfoBox>
          </Stack>
        </Card>
      </Box>
    </Box>
  )
}

export default UserSettings
