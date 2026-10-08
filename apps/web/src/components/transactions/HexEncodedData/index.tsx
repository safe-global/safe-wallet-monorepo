import type { ReactElement } from 'react'
import CopyButton from '@/components/common/CopyButton'
import { HexEncodedDataView } from '@views/components/transactions/HexEncodedData/HexEncodedDataView'

interface Props {
  hexData: string
  highlightFirstBytes?: boolean
  title?: string
  limit?: number
}

export const HexEncodedData = ({ hexData, title, highlightFirstBytes, limit }: Props): ReactElement => {
  return (
    <HexEncodedDataView
      hexData={hexData}
      title={title}
      highlightFirstBytes={highlightFirstBytes}
      limit={limit}
      renderCopyButton={(children) => <CopyButton text={hexData}>{children}</CopyButton>}
    />
  )
}
