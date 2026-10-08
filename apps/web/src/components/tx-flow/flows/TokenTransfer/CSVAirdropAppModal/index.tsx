import { AppRoutes } from '@/config/routes'
import type { ReactElement } from 'react'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { CSVAirdropAppModalView } from '@views/components/tx-flow/flows/TokenTransfer/CSVAirdropAppModal/CSVAirdropAppModalView'

const CSVAirdropAppModal = ({ onClose, appUrl }: { onClose: () => void; appUrl?: string }): ReactElement => {
  const safeLinkQuery = useSafeLinkQuery()

  return (
    <CSVAirdropAppModalView
      onClose={onClose}
      appHref={
        appUrl
          ? {
              pathname: AppRoutes.apps.open,
              query: {
                ...safeLinkQuery,
                appUrl,
              },
            }
          : undefined
      }
    />
  )
}

export default CSVAirdropAppModal
