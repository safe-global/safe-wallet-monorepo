import type { ReactElement, ReactNode } from 'react'
import { DataRow as TxDataRow } from '@/components/common/Table/DataRow'
import { Typography } from '@/components/ui/typography'

export type MethodDetailsParam = {
  key: string
  name: string
  type: string
  value: ReactNode
}

export type MethodDetailsViewProps = {
  params?: MethodDetailsParam[]
  showHexData?: boolean
  renderHexData?: (props: { title: string }) => ReactNode
}

export const MethodDetailsView = ({ params, showHexData, renderHexData }: MethodDetailsViewProps): ReactElement => {
  if (!params) {
    return (
      <>
        <Typography variant="paragraph-small" className="text-muted-foreground">
          No parameters
        </Typography>
        {showHexData && renderHexData?.({ title: 'Data' })}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {params.map((param) => {
        const title = (
          <div className="-mb-1.5">
            <Typography variant="paragraph-small">{param.name}</Typography>{' '}
            <Typography variant="paragraph-small" className="text-muted-foreground">
              {param.type}
            </Typography>
          </div>
        )

        return (
          <TxDataRow key={param.key} title={title}>
            {param.value}
          </TxDataRow>
        )
      })}
    </div>
  )
}
