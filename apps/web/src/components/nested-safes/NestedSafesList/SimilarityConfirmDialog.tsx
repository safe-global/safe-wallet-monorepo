import type { ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import useChainId from '@/hooks/useChainId'
import { SimilarityConfirmDialogView } from '@views/components/nested-safes/NestedSafesList/SimilarityConfirmDialogView'

interface SimilarityConfirmDialogProps {
  address: string
  similarAddresses: string[]
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog shown when a user tries to select an address
 * that has been flagged for similarity to another address.
 */
export function SimilarityConfirmDialog({
  address,
  similarAddresses,
  onConfirm,
  onCancel,
}: SimilarityConfirmDialogProps): ReactElement {
  const chainId = useChainId()

  return (
    <SimilarityConfirmDialogView
      address={address}
      similarAddresses={similarAddresses}
      onConfirm={onConfirm}
      onCancel={onCancel}
      renderAddress={(addr) => (
        <EthHashInfo address={addr} chainId={chainId} showCopyButton hasExplorer shortAddress={false} />
      )}
    />
  )
}
