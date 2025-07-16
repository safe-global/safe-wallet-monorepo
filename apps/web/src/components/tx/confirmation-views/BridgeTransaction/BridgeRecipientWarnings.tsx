import { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Alert, AlertTitle, Typography } from '@mui/material'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { haveSameSetup } from '@safe-global/utils/utils/safe-setup-comparison'
import { useMemo } from 'react'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useAddressBook from '@/hooks/useAddressBook'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { type BridgeWarning } from '@safe-global/utils/components/confirmation-views/BridgeTransaction/BridgeWarnings'
import {
  useBridgeWarningLogic,
  type BridgeWarningData,
} from '@safe-global/utils/components/confirmation-views/BridgeTransaction/useBridgeWarningLogic'

const WarningAlert = ({ warning }: { warning: BridgeWarning }) => (
  <Alert severity={warning.severity} sx={{ marginTop: '16px' }}>
    <AlertTitle>
      <Typography fontWeight="700">{warning.title}</Typography>
    </AlertTitle>
    {warning.description}
  </Alert>
)

export const BridgeRecipientWarnings = ({ txInfo }: { txInfo: BridgeAndSwapTransactionInfo }) => {
  const { safe } = useSafeInfo()
  const { configs } = useChains()
  const [_creationData, creationError] = useSafeCreationData(safe.address.value, configs)
  const isSameAddress = sameAddress(txInfo.recipient.value, safe.address.value)
  const destinationAddressBook = useAddressBook(txInfo.toChain)
  const destinationOwnedSafes = useOwnedSafes(txInfo.toChain)

  const isMultiChainSafe = creationError === undefined

  const { data: otherSafe, error: otherSafeError } = useSafesGetSafeV1Query(
    { chainId: txInfo.toChain, safeAddress: safe.address.value },
    { skip: !isSameAddress },
  )

  const otherSafeExists = otherSafe !== undefined

  const hasSameSetup = useMemo(() => {
    if (!otherSafeExists || otherSafeError) return false
    return haveSameSetup(otherSafe, safe)
  }, [otherSafeExists, otherSafeError, otherSafe, safe])

  const isDestinationChainSupported = configs.some((chain) => chain.chainId === txInfo.toChain)
  const isRecipientInAddressBook = destinationAddressBook[txInfo.recipient.value] !== undefined
  const isRecipientOwnedSafe = destinationOwnedSafes[txInfo.toChain]?.some((ownedSafeAddress) =>
    sameAddress(ownedSafeAddress, txInfo.recipient.value),
  )

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
