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

const SHOW_MORE = 'Show more'
const SHOW_LESS = 'Show less'

export const HexEncodedData = ({ hexData, title, highlightFirstBytes = true, limit = 20 }: Props): ReactElement => {
  const [showTxData, setShowTxData] = useState(false)
  // Check if
  const showExpandBtn = hexData.length > limit + SHOW_MORE.length + 2 // 2 for the space and the ellipsis

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
      <CopyButton text={hexData}>
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
            {showTxData ? SHOW_LESS : SHOW_MORE}
          </Link>
        )}
      </CopyButton>
    </Box>
  )

  return title ? <FieldsGrid title={title}>{content}</FieldsGrid> : content
}
