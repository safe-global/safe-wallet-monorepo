import ImportIcon from '@/public/images/common/import.svg'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type ImportAddressBookViewProps = {
  hasContacts: boolean
  onOpen: () => void
}

export const ImportAddressBookView = ({ hasContacts, onOpen }: ImportAddressBookViewProps) => (
  <Tooltip>
    <TooltipTrigger render={<div className="inline-flex" />}>
      <Button variant="outline" size="action" disabled={!hasContacts} onClick={onOpen}>
        <ImportIcon className="size-4" />
        Import
      </Button>
    </TooltipTrigger>
    {!hasContacts && <TooltipContent>You don&apos;t have any contacts in your local address book</TooltipContent>}
  </Tooltip>
)
