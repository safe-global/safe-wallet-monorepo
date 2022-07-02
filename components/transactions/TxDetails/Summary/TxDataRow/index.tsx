import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { shortenAddress } from '@/utils/formatters'
import { Typography } from '@mui/material'
import { hexDataLength } from 'ethers/lib/utils'
import { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

type TxDataRowProps = {
  title: string
  children?: ReactNode
}

export const TxDataRow = ({ title, children }: TxDataRowProps): ReactElement => {
  return (
    <div className={css.gridRow}>
      <Typography
        variant="body1"
        sx={({ palette }) => ({
          color: palette.black[400],
        })}
      >
        {title}
      </Typography>
      {children}
    </div>
  )
}

export const generateDataRowValue = (
  value?: string | null,
  type?: 'hash' | 'rawData' | 'address' | 'bytes',
  hasExplorer?: boolean,
): ReactElement | null => {
  if (value == undefined) return null
  switch (type) {
    case 'address':
      return (
        <div className={css.inline}>
          {/* TODO: missing the chain prefix */}
          <Typography variant="body1">{shortenAddress(value, 8)}</Typography>
          {/* TODO: missing copy button */}
          {/* TODO: missing block explorer button */}
        </div>
      )
    case 'hash':
      return (
        <div className={css.inline}>
          <div>{shortenAddress(value, 8)}</div>
          {/* TODO: missing copy button */}
          {/* TODO: missing block explorer button */}
        </div>
      )
    case 'rawData':
      return (
        <div className={css.rawData}>
          <div>{value ? hexDataLength(value) : 0} bytes</div>
          {/* TODO: missing copy button */}
        </div>
      )
    case 'bytes':
      return <HexEncodedData limit={60} hexData={value} />
    default:
      return <Typography variant="body2">{value}</Typography>
  }
}
