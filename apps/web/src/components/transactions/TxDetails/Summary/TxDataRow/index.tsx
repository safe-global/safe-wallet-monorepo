import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { Typography } from '@/components/ui/typography'
import { DataRow } from '@/components/common/Table/DataRow'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'

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
        <Typography variant="paragraph-small">
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
        </Typography>
      )
    case 'rawData':
    case 'bytes':
      return (
        <Typography variant="paragraph-small">
          <HexEncodedData highlightFirstBytes={false} limit={66} hexData={value} />
        </Typography>
      )
    default:
      return (
        <Typography variant="paragraph-small" className="break-all">
          {value}
        </Typography>
      )
  }
}
