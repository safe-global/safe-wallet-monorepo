import type { ReactElement } from 'react'
import { BookPlus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

const LABEL = 'Add to address book'

const AddToAddressBookAction = ({ onClick }: { onClick: () => void }): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={<Button variant="ghost" size="icon-xs" aria-label={LABEL} className="shrink-0" onClick={onClick} />}
    >
      <BookPlus className="size-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>{LABEL}</TooltipContent>
  </Tooltip>
)

export default AddToAddressBookAction
