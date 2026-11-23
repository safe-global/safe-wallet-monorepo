import type { ReactElement } from 'react'
import type { ConflictOption } from './types'

/** Where a piece of the bracket sits: the group header, then each option of the conflict */
export type ConflictBracketSegment = 'header' | 'first' | 'middle' | 'last'

export const getConflictBracketSegment = ({ option, size }: ConflictOption): ConflictBracketSegment =>
  option === size ? 'last' : option === 1 ? 'first' : 'middle'

// Rows are virtualized, so each row draws its own piece. The panel table's cells have 5px/8px transparent top/bottom
// borders, so a piece extends past the padding box to the row edges, plus 1px up to overlap the piece above.
const LINE = 'pointer-events-none absolute left-1/2 border-l-[1.5px] border-warning-accent'
const FULL_HEIGHT = 'top-[-6px] bottom-[-8px]'

const SEGMENT_CLASSES: Record<ConflictBracketSegment, string> = {
  // Below the header's text-sm nonce (cell `pt-4 pb-1`: its bottom is 16px under half height), with a 4px gap
  header: 'top-[calc(50%+20px)] bottom-[-8px]',
  first: FULL_HEIGHT,
  middle: FULL_HEIGHT,
  // Ends in a curve on the same 1.5px as the other options' ticks
  last: 'top-[-6px] bottom-[calc(50%-1.5px)] w-3 rounded-bl-md border-b-[1.5px]',
}

const BracketLine = ({ segment }: { segment: ConflictBracketSegment }): ReactElement => (
  <span aria-hidden="true" data-segment={segment} className={`${LINE} ${SEGMENT_CLASSES[segment]}`} />
)

/** The start of the bracket, under the nonce in the "Conflicting" header row. Its cell must be `relative`. */
export const ConflictBracketStart = (): ReactElement => <BracketLine segment="header" />

// The options sharing a nonce hang off one line from the group header, so the nonce shows once, in the header.
const ConflictBracket = ({ option, size, nonce }: ConflictOption & { nonce?: number }): ReactElement => {
  const segment = getConflictBracketSegment({ option, size })
  return (
    <span aria-label={`Option ${option} of ${size} at nonce ${nonce}`} role="img" className="block h-6">
      <BracketLine segment={segment} />
      {segment !== 'last' && (
        <span
          aria-hidden="true"
          data-segment="tick"
          className="pointer-events-none absolute top-1/2 left-1/2 w-3 border-b-[1.5px] border-warning-accent"
        />
      )}
    </span>
  )
}

export default ConflictBracket
