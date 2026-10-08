import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import TxSectionTitle from '@/components/tx-flow/common/TxSectionTitle'

export type TxNoteViewProps = {
  note: string
  creator: ReactNode
}

export function TxNoteView({ note, creator }: TxNoteViewProps) {
  return (
    <div>
      <TxSectionTitle className="gap-0">
        Note
        <Tooltip>
          <TooltipTrigger
            data-testid="tx-note-tooltip"
            render={<span className="inline-flex h-[1em] text-muted-foreground" />}
          >
            <InfoIcon height="100%" />
          </TooltipTrigger>
          <TooltipContent>
            <div data-testid="note-creator" className="flex flex-row gap-2">
              <span>By </span>
              {creator ? creator : <span>transaction creator</span>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TxSectionTitle>

      <Typography
        data-testid="tx-note"
        variant="paragraph"
        className="mt-2 rounded-lg bg-[var(--color-background-main)] p-4"
      >
        {note}
      </Typography>
    </div>
  )
}
