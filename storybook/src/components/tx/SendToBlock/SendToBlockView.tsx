import type { ReactNode } from 'react'
import FieldsGrid from '@views/components/tx/FieldsGrid'

export type SendToBlockViewProps = {
  title?: string
  addressInfo: ReactNode
}

export const SendToBlockView = ({ title = 'Recipient', addressInfo }: SendToBlockViewProps) => {
  return (
    <FieldsGrid title={title}>
      <div className="text-sm leading-5">{addressInfo}</div>
    </FieldsGrid>
  )
}
