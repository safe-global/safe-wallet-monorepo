import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { DataRow } from '@/components/common/Table/DataRow'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { TxDataRowValueView } from '@views/components/transactions/TxDetails/Summary/TxDataRow/TxDataRowView'

export const TxDataRow = DataRow

export const generateDataRowValue = (
  value?: string,
  type?: 'hash' | 'rawData' | 'address' | 'bytes',
  hasExplorer?: boolean,
  addressInfo?: AddressInfo,
): ReactElement | null => {
  if (value == undefined) return null

  switch (type) {
    case 'hash':
    case 'address':
      const customAvatar = addressInfo?.logoUri

      return (
        <TxDataRowValueView
          value={value}
          content={
            <NamedAddressInfo
              address={value}
              name={addressInfo?.name}
              customAvatar={customAvatar}
              showAvatar={type === 'address'}
              avatarSize={20}
              showPrefix={false}
              shortAddress={type !== 'address'}
              hasExplorer={hasExplorer}
              highlight4bytes
            />
          }
        />
      )
    case 'rawData':
    case 'bytes':
      return (
        <TxDataRowValueView
          value={value}
          content={<HexEncodedData highlightFirstBytes={false} limit={66} hexData={value} />}
        />
      )
    default:
      return <TxDataRowValueView value={value} />
  }
}
