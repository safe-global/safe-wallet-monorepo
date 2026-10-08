import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useMemo, type ReactElement } from 'react'
import { useIsOnlySpendingLimitBeneficiary } from '@/features/spending-limits'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '../ConnectWallet/useConnectWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import useSafeInfo from '@/hooks/useSafeInfo'
import { CheckWalletView, type CheckWalletReason } from '@views/components/common/CheckWallet/CheckWalletView'
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

  const reason = useMemo((): CheckWalletReason | undefined => {
    if (!wallet) {
      return 'walletNotConnected'
    }
    if (!sdk && safeLoaded) {
      return 'sdkNotInitialized'
    }

    if (isUndeployedSafe && !allowUndeployedSafe) {
      return 'safeNotActivated'
    }

    if (
      !allowNonOwner &&
      !isSafeOwner &&
      !isProposer &&
      !isNestedSafeOwner &&
      (!isOnlySpendingLimit || !allowSpendingLimit)
    ) {
      return 'notSafeOwner'
    }

    if (!allowProposer && isProposer && !isSafeOwner && !isNestedSafeOwner) {
      return 'notSafeOwner'
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
  if (!reason) return children(true)
  if (noTooltip) return children(false)

  return (
    <CheckWalletView
      reason={reason}
      onTriggerClick={wallet ? undefined : connectWallet}
      testId="check-wallet-tooltip-trigger"
    >
      {children(false)}
    </CheckWalletView>
  )
}

export default CheckWallet
