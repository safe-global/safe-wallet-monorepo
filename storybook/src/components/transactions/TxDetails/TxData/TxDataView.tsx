import type { ReactElement, ReactNode } from 'react'

export const ParsingErrorView = (): ReactElement => <div>Error parsing data</div>

export type TxDataViewProps = {
  decodedData: ReactNode
  multisend?: ReactNode
}

export const TxDataView = ({ decodedData, multisend }: TxDataViewProps): ReactElement => {
  return (
    <>
      {decodedData}

      {multisend}
    </>
  )
}
