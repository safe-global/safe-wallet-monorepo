import type { ReactElement, ReactNode } from 'react'

export type CreateSafeInfosViewProps = {
  staticWidget?: ReactNode
  dynamicWidget?: ReactNode
}

export function CreateSafeInfosView({ staticWidget, dynamicWidget }: CreateSafeInfosViewProps): ReactElement {
  return (
    <div className="col-span-12">
      <div className="flex flex-col gap-6">
        {staticWidget && <div>{staticWidget}</div>}
        {dynamicWidget && <div>{dynamicWidget}</div>}
      </div>
    </div>
  )
}
