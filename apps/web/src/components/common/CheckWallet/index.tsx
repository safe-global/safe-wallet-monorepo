import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useMemo, type ReactElement } from 'react'
import { useIsOnlySpendingLimitBeneficiary } from '@/features/spending-limits'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { Tooltip } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'

type CheckWalletProps = {
  children: (ok: boolean) => ReactElement
  allowSpendingLimit?: boolean
  allowNonOwner?: boolean
  noTooltip?: boolean
  checkNetwork?: boolean
  allowUndeployedSafe?: boolean
  allowProposer?: boolean
}

enum Message {
  WalletNotConnected = 'Please connect your wallet',
  SDKNotInitialized = 'SDK is not initialized yet',
  NotSafeOwner = 'Your connected wallet is not a signer of this Safe Account',
  SafeNotActivated = 'You need to activate the Safe before transacting',
}

const CheckWallet = ({
  children,
  allowSpendingLimit,
  allowNonOwner,
  noTooltip,
  checkNetwork = false,
  allowUndeployedSafe = false,
  allowProposer = true,
}: CheckWalletProps): ReactElement => {
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const isOnlySpendingLimit = useIsOnlySpendingLimitBeneficiary()
  const connectWallet = useConnectWallet()
  const isWrongChain = useIsWrongChain()
  const sdk = useSafeSDK()
  const isProposer = useIsWalletProposer()

  const { safe, safeLoaded } = useSafeInfo()

  const isNestedSafeOwner = useIsNestedSafeOwner()

  const isUndeployedSafe = !safe.deployed

  const message = useMemo(() => {
    if (!wallet) {
      return Message.WalletNotConnected
    }
    if (!sdk && safeLoaded) {
      return Message.SDKNotInitialized
    }

    if (isUndeployedSafe && !allowUndeployedSafe) {
      return Message.SafeNotActivated
    }

    if (
      !allowNonOwner &&
      !isSafeOwner &&
      !isProposer &&
      !isNestedSafeOwner &&
      (!isOnlySpendingLimit || !allowSpendingLimit)
    ) {
      return Message.NotSafeOwner
    }

    if (!allowProposer && isProposer && !isSafeOwner && !isNestedSafeOwner) {
      return Message.NotSafeOwner
    }
  }, [
    allowNonOwner,
    allowProposer,
    allowSpendingLimit,
    allowUndeployedSafe,
    isProposer,
    isNestedSafeOwner,
    isOnlySpendingLimit,
    isSafeOwner,
    isUndeployedSafe,
    sdk,
    wallet,
    safeLoaded,
  ])

  if (checkNetwork && isWrongChain) return children(false)
  if (!message) return children(true)
  if (noTooltip) return children(false)

  return (
    <Tooltip title={message}>
      <span onClick={wallet ? undefined : connectWallet}>{children(false)}</span>
    </Tooltip>
  )
}

export default CheckWallet
