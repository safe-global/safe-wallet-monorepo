import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import type { TokenTransferParams } from './types'

export type ReviewTokenTransferViewProps = {
  recipients: TokenTransferParams[]
  renderRecipientRow: (recipient: TokenTransferParams, name: string) => ReactNode
}

export const ReviewTokenTransferView = ({
  recipients,
  renderRecipientRow,
}: ReviewTokenTransferViewProps): ReactElement => (
  <>
    {recipients.length > 1 && (
      <div className="flex flex-col gap-4">
        {recipients.map((recipient, index) => (
          <Fragment key={`${recipient.recipient}_${index}`}>
            {index > 0 && <Separator />}
            {renderRecipientRow(recipient, `Recipient ${index + 1}`)}
          </Fragment>
        ))}
      </div>
    )}

    {recipients.length > 1 && <Separator />}
  </>
)
