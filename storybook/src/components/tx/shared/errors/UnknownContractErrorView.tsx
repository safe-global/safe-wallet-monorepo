import { type ReactElement } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { ErrorMessageView } from '@views/components/tx/ErrorMessage/ErrorMessageView'

export type UnknownContractErrorViewProps = {
  isMigrationPossible: boolean
  explorerHref: string
  chainName?: string
}

export const UnknownContractErrorView = ({
  isMigrationPossible,
  explorerHref,
  chainName,
}: UnknownContractErrorViewProps): ReactElement => {
  return (
    <ErrorMessageView level="error" title="This Safe account was created with an unsupported base contract.">
      {isMigrationPossible ? (
        <>
          The Safe account can be migrated to use the supported base contract. We advise to do that in the Safe&apos;s
          settings before executing other transactions.
        </>
      ) : (
        <>
          It should <b>ONLY</b> be used for fund recovery. Transactions will execute but the transaction list may not
          update. Transaction success can be verified on the{' '}
          <ExternalLink href={explorerHref}>{chainName} explorer</ExternalLink>.
        </>
      )}
    </ErrorMessageView>
  )
}
