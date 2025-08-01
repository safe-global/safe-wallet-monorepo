import React, { useMemo } from 'react'
import { Alert } from '@/src/components/Alert'
import { BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, selectChainById } from '@/src/store/chains'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { haveSameSetup } from '@safe-global/utils/utils/safe-setup-comparison'
import { Address } from '@/src/types/address'
import { type BridgeWarning } from '@safe-global/utils/components/confirmation-views/BridgeTransaction/BridgeWarnings'
import {
  useBridgeWarningLogic,
  type BridgeWarningData,
} from '@safe-global/utils/components/confirmation-views/BridgeTransaction/useBridgeWarningLogic'
import { useSafeCreationData } from '@/src/hooks/useSafeCreationData'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { RootState } from '@/src/store'

interface WarningAlertProps {
  warning: BridgeWarning
}

const WarningAlert = ({ warning }: WarningAlertProps) => (
  <Alert
    type={warning.severity}
    message={warning.title}
    info={warning.description}
    testID={`bridge-warning-${warning.severity}`}
  />
)

interface BridgeRecipientWarningsProps {
  txInfo: BridgeAndSwapTransactionInfo
}

export const BridgeRecipientWarnings = ({ txInfo }: BridgeRecipientWarningsProps) => {
  const activeSafe = useDefinedActiveSafe()
  const allChains = useAppSelector(selectAllChains)
  const activeSafeInfo = useAppSelector((state) => selectSafeInfo(state, activeSafe.address as Address))
  const destinationContact = useAppSelector((state) => selectContactByAddress(txInfo.recipient.value)(state))
  const destinationChain = useAppSelector((state: RootState) => selectChainById(state, txInfo.toChain))
  const [creationData] = useSafeCreationData(activeSafe.chainId)
  const compatibleNetworks = useCompatibleNetworks(creationData, [destinationChain])

  const isSameAddress = sameAddress(txInfo.recipient.value, activeSafe.address)

  // Check if destination chain is supported
  const isDestinationChainSupported = allChains?.some((chain) => chain.chainId === txInfo.toChain) ?? false

  // Current safe can be created on the destination chain
  const isMultiChainSafe = compatibleNetworks.length > 0

  const { data: otherSafe, error: otherSafeError } = useSafesGetSafeV1Query(
    { chainId: txInfo.toChain, safeAddress: activeSafe.address },
    { skip: !isSameAddress },
  )

  const otherSafeExists = otherSafe !== undefined

  const hasSameSetup = useMemo(() => {
    if (!otherSafeExists || otherSafeError || !activeSafeInfo) {
      return false
    }

    // Get safe info for current chain
    const currentSafeInfo = activeSafeInfo[activeSafe.chainId]
    if (!currentSafeInfo) {
      return false
    }

    return haveSameSetup(otherSafe, currentSafeInfo)
  }, [otherSafeExists, otherSafeError, activeSafeInfo, activeSafe.chainId, otherSafe])

  // Check if recipient is in address book
  const isRecipientInAddressBook = destinationContact !== null

  // Check if recipient is an owned safe on destination chain
  const isRecipientOwnedSafe = useMemo(() => {
    if (!activeSafeInfo) {
      return false
    }

    // Check if we have this address as a safe on the destination chain
    const destinationSafeInfo = activeSafeInfo[txInfo.toChain]
    return destinationSafeInfo !== undefined && sameAddress(destinationSafeInfo.address.value, txInfo.recipient.value)
  }, [activeSafeInfo, txInfo.toChain, txInfo.recipient.value])

  // Prepare data for shared warning logic
  const warningData: BridgeWarningData = useMemo(
    () => ({
      isSameAddress,
      isDestinationChainSupported,
      isMultiChainSafe,
      otherSafeExists,
      hasSameSetup,
      isRecipientInAddressBook,
      isRecipientOwnedSafe,
    }),
    [
      isSameAddress,
      isDestinationChainSupported,
      isMultiChainSafe,
      otherSafeExists,
      hasSameSetup,
      isRecipientInAddressBook,
      isRecipientOwnedSafe,
    ],
  )

  // Use shared warning logic
  const warning = useBridgeWarningLogic(warningData)

  // Render warning if one exists
  if (warning) {
    return <WarningAlert warning={warning} />
  }

  return null
}
