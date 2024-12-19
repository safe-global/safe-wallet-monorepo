import { type ReactElement } from 'react'
import { Tooltip } from '@mui/material'
import useIsOnlySpendingLimitBeneficiary from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import { useRouter } from 'next/router'

type CheckWalletProps = {
  children: (ok: boolean) => ReactElement
  allowSpendingLimit?: boolean
  allowNonOwner?: boolean
}

enum Message {
  WalletNotConnected = 'Please connect your wallet',
  NotSafeOwner = 'Your connected wallet is not an owner of this Safe Account. Click to claim.',
  OnlySpendingLimitBeneficiary = 'You can only create ERC-20 transactions within your spending limit',
}

const CheckWallet = ({ children, allowSpendingLimit, allowNonOwner }: CheckWalletProps): ReactElement => {
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const isSpendingLimit = useIsOnlySpendingLimitBeneficiary()
  const router = useRouter()
  const connectWallet = useConnectWallet()

  const message = !wallet
    ? Message.WalletNotConnected
    : !isSafeOwner && !isSpendingLimit && !allowNonOwner
    ? Message.NotSafeOwner
    : isSpendingLimit && !allowSpendingLimit && !allowNonOwner
    ? Message.OnlySpendingLimitBeneficiary
    : ''

  const claimRedirect = () => {
    router.push({
      pathname: '/claim',
      query: { safe: router.query?.safe },
    })
  }

  if (!message) return children(true)

  return (
    <Tooltip title={message}>
      <span onClick={wallet ? (message === Message.NotSafeOwner ? claimRedirect : undefined) : connectWallet}>
        {children(false)}
      </span>
    </Tooltip>
  )
}

export default CheckWallet
