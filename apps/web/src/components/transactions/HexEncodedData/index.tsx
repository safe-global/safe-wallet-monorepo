import { shortenText } from '@safe-global/utils/utils/formatters'
import { Box, Link, Tooltip } from '@mui/material'
import type { ReactElement } from 'react'
import { useState } from 'react'
import css from './styles.module.css'
import CopyButton from '@/components/common/CopyButton'
import FieldsGrid from '@/components/tx/FieldsGrid'

interface Props {
  hexData: string
  highlightFirstBytes?: boolean
  title?: string
  limit?: number
}

const FIRST_BYTES = 10

export const HexEncodedData = ({ hexData, title, highlightFirstBytes = true, limit = 20 }: Props): ReactElement => {
  const [showTxData, setShowTxData] = useState(false)
  const showExpandBtn = hexData.length > limit

  const toggleExpanded = () => {
    setShowTxData((val) => !val)
  }

  const firstBytes = highlightFirstBytes ? (
    <Tooltip title="The first 4 bytes determine the contract method that is being called" arrow>
      <b>{hexData.slice(0, FIRST_BYTES)}</b>
    </Tooltip>
  ) : null
  const restBytes = highlightFirstBytes ? hexData.slice(FIRST_BYTES) : hexData

  const content = (
    <Box data-testid="tx-hexData" className={css.encodedData}>
      <CopyButton text={hexData} />

      <>
        {firstBytes}
        {showTxData || !showExpandBtn ? restBytes : shortenText(restBytes, limit - FIRST_BYTES)}{' '}
        {showExpandBtn && (
          <Link
            component="button"
            data-testid="show-more"
            onClick={toggleExpanded}
            type="button"
            sx={{ verticalAlign: 'text-top' }}
          >
            Show {showTxData ? 'less' : 'more'}
          </Link>
        )}
      </>
    </Box>
  )

  return title ? <FieldsGrid title={title}>{content}</FieldsGrid> : content
}
