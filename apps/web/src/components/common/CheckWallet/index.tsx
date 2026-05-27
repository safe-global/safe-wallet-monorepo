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
import { useIsGnosisPaySafe } from '@/features/gnosispay'

type CheckWalletProps = {
  children: (ok: boolean) => ReactElement
  allowSpendingLimit?: boolean
  allowNonOwner?: boolean
  /**
   * Pass to let any visitor of a Gnosis Pay safe through (nav / preview gates).
   * The actual write permission (must be the wallet enabled on the Delay modifier)
   * is enforced inside the lazy-loaded GnosisPayExecutionForm via its
   * `cannotPropose` check, not here — keeping `useIsGnosisPayOwner` (which pulls
   * @gnosis.pm/zodiac) out of the main bundle.
   */
  allowGnosisPaySafe?: boolean
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
  allowGnosisPaySafe,
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
  // Only opt into the Gnosis Pay safe detector (per-module eth_getCode on
  // chain 100) when the caller actually cares about the gnosis pay path.
  const [isGnosisPaySafe] = useIsGnosisPaySafe({ enabled: !!allowGnosisPaySafe })

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
      !(allowGnosisPaySafe && isGnosisPaySafe) &&
      (!isOnlySpendingLimit || !allowSpendingLimit)
    ) {
      return Message.NotSafeOwner
    }

    if (!allowProposer && isProposer && !isSafeOwner && !isNestedSafeOwner) {
      return Message.NotSafeOwner
    }
  }, [
    allowNonOwner,
    allowGnosisPaySafe,
    allowProposer,
    allowSpendingLimit,
    allowUndeployedSafe,
    isGnosisPaySafe,
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
