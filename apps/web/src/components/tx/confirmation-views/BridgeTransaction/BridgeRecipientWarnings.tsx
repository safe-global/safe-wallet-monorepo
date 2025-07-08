import { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
import { areOwnersMatching } from '@/features/multichain/utils/utils'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Alert, AlertTitle, Typography } from '@mui/material'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useAddressBook from '@/hooks/useAddressBook'
import useOwnedSafes from '@/hooks/useOwnedSafes'

type WarningSeverity = 'warning' | 'error'

interface BridgeWarning {
  title: string
  description: string
  severity: WarningSeverity
}

export const BridgeWarnings: Record<string, BridgeWarning> = {
  DIFFERENT_SETUP: {
    title: 'Different Safe setup on target chain',
    description:
      'Your Safe exists on the target chain but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.',
    severity: 'warning',
  },
  NO_MULTICHAIN_SUPPORT: {
    title: 'Incompatible Safe version',
    description:
      'This Safe account cannot add new networks. You will not be able to claim ownership of the same address on other networks. Funds sent may be inaccessible.',
    severity: 'error',
  },
  SAFE_NOT_DEPLOYED: {
    title: 'No ownership on target chain',
    description:
      'This Safe account is not activated on the target chain. First, create the Safe, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.',
    severity: 'warning',
  },
  DIFFERENT_ADDRESS: {
    title: 'Unknown address',
    description:
      'The recipient is not a Safe you own or a known recipient in your address book. If this address is incorrect, your funds could be lost permanently.',
    severity: 'warning',
  },
  UNKNOWN_CHAIN: {
    title: 'The target network is not supported',
    description:
      'app.safe.global does not support the network. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.',
    severity: 'error',
  },
} as const

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

    const hasMatchingOwners = areOwnersMatching(
      otherSafe.owners.map((owner) => owner.value),
      safe.owners.map((owner) => owner.value),
    )
    const hasMatchingThreshold = otherSafe.threshold === safe.threshold

    return hasMatchingOwners && hasMatchingThreshold
  }, [otherSafeExists, otherSafeError, safe.owners, safe.threshold, otherSafe])

  const isDestinationChainSupported = configs.some((chain) => chain.chainId === txInfo.toChain)
  const isRecipientInAddressBook = destinationAddressBook[txInfo.recipient.value] !== undefined
  const isRecipientOwnedSafe = destinationOwnedSafes[txInfo.toChain]?.some((ownedSafeAddress) =>
    sameAddress(ownedSafeAddress, txInfo.recipient.value),
  )

  if (isSameAddress) {
    if (!isDestinationChainSupported) {
      return <WarningAlert warning={BridgeWarnings.UNKNOWN_CHAIN} />
    }

    if (otherSafeExists) {
      if (hasSameSetup) {
        return null
      }
      return <WarningAlert warning={BridgeWarnings.DIFFERENT_SETUP} />
    }
    if (!isMultiChainSafe) {
      return <WarningAlert warning={BridgeWarnings.NO_MULTICHAIN_SUPPORT} />
    }
    return <WarningAlert warning={BridgeWarnings.SAFE_NOT_DEPLOYED} />
  }

  if (!isRecipientInAddressBook && !isRecipientOwnedSafe) {
    return <WarningAlert warning={BridgeWarnings.DIFFERENT_ADDRESS} />
  }

  return null
}
