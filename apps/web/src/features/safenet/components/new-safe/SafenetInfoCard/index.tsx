import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import BellIcon from '@/public/images/safenet/bell.svg'
import { useDeploySafenetAccountQuery } from '@/store/safenet'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import css from './styles.module.css'

function SafenetInfoCard() {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const wallet = useWallet()
  const [displayBanner, setDisplayBanner] = useState<boolean>(true)

  const onClick = () => {
    router.push({
      pathname: AppRoutes.newSafe.safenetCreate,
    })
  }

  const safeDeploymentProps = useMemo(() => {
    return {
      account: {
        owners: wallet?.address ? [wallet.address] : [],
        threshold: 1,
      },
      saltNonce: Date.now().toString(),
      dryRun: true,
    }
  }, [wallet?.address])

  const { status } = useDeploySafenetAccountQuery(safeDeploymentProps, {
    skip: !displayBanner,
  })

  return (
    displayBanner &&
    status === 'fulfilled' && (
      <Box className={isDarkMode ? css.darkCard : css.lightCard}>
        <IconButton className={css.close} onClick={() => setDisplayBanner(false)} size="small">
          <CloseIcon fontSize="medium" />
        </IconButton>
        <Box className={css.images}>
          <BellIcon height="32" className={css.bellIcon} />
          <Box className={css.newTag}>
            <Typography fontSize={12}>New</Typography>
          </Box>
        </Box>
        <Box className={css.description}>
          <Typography variant="body2">
            Create a new account with Safenet to unlock a unified and secure experience across networks.
          </Typography>
          <Button onClick={onClick} variant="outlined" size="small">
            Learn more
          </Button>
        </Box>
      </Box>
    )
  )
}

export default SafenetInfoCard
