import type { ReactElement } from 'react'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'
import { CopyTransactionLinkView } from '@views/features/spaces/components/Policies/SpendingLimitDrawer/components/CopyTransactionLink/CopyTransactionLinkView'

export type CopyTransactionLinkProps = {
  transactionLink: string
}

const CopyTransactionLink = ({ transactionLink }: CopyTransactionLinkProps): ReactElement => {
  const { copied, copy } = useCopyToClipboard()

  return <CopyTransactionLinkView copied={copied} onCopy={() => copy(transactionLink)} />
}

export default CopyTransactionLink
