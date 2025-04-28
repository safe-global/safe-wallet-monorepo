import { shortenText } from '@safe-global/utils/utils/formatters'
import { Box, Link, Tooltip } from '@mui/material'
import type { ReactElement, SyntheticEvent } from 'react'
import { Fragment, useState } from 'react'
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

  const toggleExpanded = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowTxData((val) => !val)
  }

  const firstBytes = highlightFirstBytes ? (
    <Tooltip title="The first 4 bytes determine the contract method that is being called" arrow>
      <b>{hexData.slice(0, FIRST_BYTES)}</b>
    </Tooltip>
  ) : null
  const restBytes = highlightFirstBytes ? hexData.slice(FIRST_BYTES) : hexData

  const dimmedZeroes: ReactElement[] = []
  let index = 0
  restBytes.replace(/(.*?)(0{18,})(.*?)/g, (_, p1, p2, p3) => {
    dimmedZeroes.push(
      <Fragment key={index++}>{p1}</Fragment>,
      <span className={css.zeroes} key={index++}>
        {p2}
      </span>,
      <Fragment key={index++}>{p3}</Fragment>,
    )
    return ''
  })

  const fullData = dimmedZeroes.length ? dimmedZeroes : restBytes

  const content = (
    <Box data-testid="tx-hexData" className={css.encodedData}>
      <CopyButton text={hexData}>
        <span className={css.monospace}>
          {firstBytes}
          {showTxData || !showExpandBtn ? fullData : shortenText(restBytes, limit - FIRST_BYTES)}{' '}
        </span>
      </CopyButton>

      {showExpandBtn && (
        <Link
          component="button"
          data-testid="show-more"
          onClick={toggleExpanded}
          type="button"
          className={css.showMore}
        >
          {showTxData ? SHOW_LESS : SHOW_MORE}
        </Link>
      )}
    </Box>
  )

  return title ? <FieldsGrid title={title}>{content}</FieldsGrid> : content
}
