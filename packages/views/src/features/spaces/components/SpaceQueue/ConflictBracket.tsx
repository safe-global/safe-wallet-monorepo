import type { ReactElement } from 'react'
import type { ConflictOption } from './types'

// The options sharing a nonce hang off one line from the group header, so the nonce shows once, in the header.
const ConflictBracket = ({ option, size, nonce }: ConflictOption & { nonce?: number }): ReactElement => {
  const isLast = option === size
  return (
    <span aria-label={`Option ${option} of ${size} at nonce ${nonce}`} role="img" className="block h-6">
      <span
        aria-hidden="true"
        className={`absolute left-1/2 w-3 border-l-[1.5px] border-warning-accent ${
          isLast
            ? 'top-[-30px] h-[calc(50%+30px)] rounded-bl-md border-b-[1.5px]'
            : option === 1
              ? 'top-[-22px] bottom-[-8px]'
              : 'top-[-30px] bottom-[-8px]'
        }`}
      />
      {!isLast && (
        <span aria-hidden="true" className="absolute top-1/2 left-1/2 w-3 border-b-[1.5px] border-warning-accent" />
      )}
    </span>
  )
}

export default ConflictBracket
