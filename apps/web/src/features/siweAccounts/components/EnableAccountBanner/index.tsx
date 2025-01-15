import { signInWithEthereum } from '@/services/siwe'
import { Alert, Box, Button, IconButton, Typography } from '@mui/material'
import useWallet from '@/hooks/wallets/useWallet'
import CloseIcon from '@mui/icons-material/Close'
import DownloadCloud from '@/public/images/common/download-cloud.svg'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import css from './style.module.css'
import { useState } from 'react'
import { createAccount, getAccount } from '@safe-global/safe-gateway-typescript-sdk'
import type { BrowserProvider } from 'ethers'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@/services/exceptions/ErrorCodes'

const SignInBanner = ({ provider }: { provider: BrowserProvider | undefined }) => {
  const { address = '' } = useWallet() || {}
  const [isDismissed, setIsDismissed] = useState(false)

  if (!provider || isDismissed) return null

  const signIn = async () => {
    let account
    try {
      await signInWithEthereum(provider)
      account = await getAccount(address)
    } catch (error) {
      logError(ErrorCodes._640, error)
    }
    if (!account) {
      try {
        account = await createAccount({
          address: address as `0x${string}`,
          name: address.split('').slice(0, 4).join(''),
        })
      } catch (error) {
        logError(ErrorCodes._641, error)
      }
    }
  }

  return (
    <div className={css.container}>
      <Alert
        icon={<DownloadCloud />}
        action={
          <>
            <Button onClick={signIn} endIcon={<ChevronRightIcon />} sx={{ padding: '2px', minWidth: '130px' }}>
              <Typography noWrap fontWeight={700}>
                Enable now
              </Typography>
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setIsDismissed(true)
              }}
            >
              <CloseIcon fontSize="inherit" sx={{ color: 'border.main' }} />
            </IconButton>
          </>
        }
      >
        <Box display="flex" alignContent="center" alignItems="center" width="100%">
          <Typography flex="1">
            <b>Access your accounts on any device!</b> Enable cloud storage to switch devices effortlessly and keep your
            data secure.
          </Typography>
        </Box>
      </Alert>
    </div>
  )
}

export default SignInBanner
