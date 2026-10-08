import type { ReactElement } from 'react'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import { RecipientGroupHeaderView } from '@views/components/common/AddressBookInput/RecipientGroupHeaderView'

const RecipientGroupHeader = ({
  source,
  workspaceName,
  count,
}: {
  source: ContactSource
  workspaceName?: string
  count: number
}): ReactElement => (
  <RecipientGroupHeaderView isSpace={source === ContactSource.space} workspaceName={workspaceName} count={count} />
)

export default RecipientGroupHeader
