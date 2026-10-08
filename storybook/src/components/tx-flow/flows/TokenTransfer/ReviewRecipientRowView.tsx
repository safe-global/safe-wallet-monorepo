import type { ReactElement, ReactNode } from 'react'

export type ReviewRecipientRowViewProps = {
  amountBlock: ReactNode
  sendToBlock: ReactNode
}

const ReviewRecipientRowView = ({ amountBlock, sendToBlock }: ReviewRecipientRowViewProps): ReactElement => {
  return (
    <div className="flex flex-col gap-4">
      {amountBlock}
      {sendToBlock}
    </div>
  )
}

export { ReviewRecipientRowView }
