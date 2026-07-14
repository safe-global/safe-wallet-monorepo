import { shortenText } from '@safe-global/utils/utils/formatters'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
const ZEROES_PATTERN = /^0+$/

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
    <Tooltip>
      <TooltipTrigger render={<b>{hexData.slice(0, FIRST_BYTES)}</b>} />
      <TooltipContent>The first 4 bytes determine the contract method that is being called</TooltipContent>
    </Tooltip>
  ) : null
  const restBytes = highlightFirstBytes ? hexData.slice(FIRST_BYTES) : hexData

  const dimmedZeroes: ReactElement[] = []
  const parts = restBytes.split(/(0{18,})/)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue
    if (ZEROES_PATTERN.test(part) && part.length >= 18) {
      dimmedZeroes.push(
        <span className={css.zeroes} key={i}>
          {part}
        </span>,
      )
    } else {
      dimmedZeroes.push(<Fragment key={i}>{part}</Fragment>)
    }
  }

  const fullData = dimmedZeroes.length ? dimmedZeroes : restBytes

  const content = (
    <div data-testid="tx-hexData" className={css.encodedData}>
      <CopyButton text={hexData}>
        <span className={css.monospace}>
          {firstBytes}
          {showTxData || !showExpandBtn ? fullData : shortenText(restBytes, limit - FIRST_BYTES)}{' '}
        </span>
      </CopyButton>

      {showExpandBtn && (
        <Link
          render={<button type="button" />}
          data-testid="show-more"
          onClick={toggleExpanded}
          className={css.showMore}
        >
          {showTxData ? SHOW_LESS : SHOW_MORE}
        </Link>
      )}
    </div>
  )

  return title ? <FieldsGrid title={title}>{content}</FieldsGrid> : content
}
