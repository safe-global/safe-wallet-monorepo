import { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
import { areOwnersMatching } from '@/features/multichain/utils/utils'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Alert } from '@mui/material'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useAddressBook from '@/hooks/useAddressBook'

export const BridgeWarnings = {
  DIFFERENT_SETUP:
    'Your Safe account has a different setup on the destination chain. Please make sure that you have control over the account.',
  NO_MULTICHAIN_SUPPORT:
    'This Safe account does not support adding networks. Please bridge to a different account address.',
  SAFE_NOT_DEPLOYED:
    'Your Safe account does not exist on the destination chain. We recommend to first create the Safe account, execute a test transaction and then bridge to it.',
  DIFFERENT_ADDRESS:
    'You are bridging to a different account address. Please check that you are bridging to the correct account.',
  UNKNOWN_CHAIN:
    "You are sending funds to your Safe's address on a chain that is not supported. You won't be able to recover / use those funds through this interface. You should select a different receiver address.",
} as const

export const BridgeReceiverWarnings = ({ txInfo }: { txInfo: BridgeAndSwapTransactionInfo }) => {
  const { safe } = useSafeInfo()
  const { configs } = useChains()
  const [_creationData, creationError] = useSafeCreationData(safe.address.value, configs)
  const isSameAddress = sameAddress(txInfo.recipient.value, safe.address.value)
  const destinationAddressBook = useAddressBook(txInfo.toChain)

  const isMultiChainSafe = creationError === undefined

  const { data: otherSafe, error: otherSafeError } = useSafesGetSafeV1Query(
    { chainId: txInfo.toChain, safeAddress: safe.address.value },
    { skip: !isSameAddress },
  )

  const otherSafeExists = otherSafe !== undefined

  const hasSameSetup = useMemo(() => {
    if (!otherSafeExists || otherSafeError) return false

    const hasMatchingOwners = areOwnersMatching(
      otherSafe.owners.map((owner) => owner.value),
      safe.owners.map((owner) => owner.value),
    )
    const hasMatchingThreshold = otherSafe.threshold === safe.threshold

    return hasMatchingOwners && hasMatchingThreshold
  }, [otherSafeExists, otherSafeError, safe.owners, safe.threshold, otherSafe])

  const isDestinationChainSupported = configs.some((chain) => chain.chainId === txInfo.toChain)
  const isRecipientInAddressBook = destinationAddressBook[txInfo.recipient.value] !== undefined

  if (isSameAddress) {
    if (!isDestinationChainSupported) {
      return <Alert severity="error">{BridgeWarnings.UNKNOWN_CHAIN}</Alert>
    }

    if (otherSafeExists) {
      if (hasSameSetup) {
        return null
      }
      return <Alert severity="warning">{BridgeWarnings.DIFFERENT_SETUP}</Alert>
    }
    if (!isMultiChainSafe) {
      return <Alert severity="error">{BridgeWarnings.NO_MULTICHAIN_SUPPORT}</Alert>
    }
    return <Alert severity="warning">{BridgeWarnings.SAFE_NOT_DEPLOYED}</Alert>
  }

  if (!isRecipientInAddressBook) {
    return <Alert severity="warning">{BridgeWarnings.DIFFERENT_ADDRESS}</Alert>
  }

  return null
}
