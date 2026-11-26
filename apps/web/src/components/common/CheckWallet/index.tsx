import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useMemo, type ReactElement } from 'react'
import useIsOnlySpendingLimitBeneficiary from '@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'

export type CheckWalletProps = {
  children: (ok: boolean) => ReactElement
  allowSpendingLimit?: boolean
  allowNonOwner?: boolean
  noTooltip?: boolean
  checkNetwork?: boolean
  allowUndeployedSafe?: boolean
  allowProposer?: boolean
}

export enum CheckWalletMessage {
  WalletNotConnected = 'Please connect your wallet',
  SDKNotInitialized = 'Still loading. Try again in a moment.',
  NotSafeOwner = 'Your connected wallet is not a signer of this Safe account',
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
      return CheckWalletMessage.WalletNotConnected
    }
    if (!sdk && safeLoaded) {
      return CheckWalletMessage.SDKNotInitialized
    }

    if (isUndeployedSafe && !allowUndeployedSafe) {
      return CheckWalletMessage.SafeNotActivated
    }

    if (
      !allowNonOwner &&
      !isSafeOwner &&
      !isProposer &&
      !isNestedSafeOwner &&
      (!isOnlySpendingLimit || !allowSpendingLimit)
    ) {
      return CheckWalletMessage.NotSafeOwner
    }

    if (!allowProposer && isProposer && !isSafeOwner && !isNestedSafeOwner) {
      return CheckWalletMessage.NotSafeOwner
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
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-testid="check-wallet-tooltip-trigger"
            aria-label={message}
            onClick={wallet ? undefined : connectWallet}
          />
        }
      >
        {children(false)}
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  )
}

export default CheckWallet
