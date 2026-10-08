import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type TxDataRowValueViewProps = {
  value: string
  content?: ReactNode
}

export const TxDataRowValueView = ({ value, content }: TxDataRowValueViewProps): ReactElement => {
  if (content !== undefined) {
    return <Typography variant="paragraph-small">{content}</Typography>
  }

  return (
    <Typography variant="paragraph-small" className="break-all">
      {value}
    </Typography>
  )
}
