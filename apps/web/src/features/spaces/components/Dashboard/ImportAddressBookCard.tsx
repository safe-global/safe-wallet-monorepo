import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useState } from 'react'
import ImportAddressBookDialog from '../SpaceAddressBook/Import/ImportAddressBookDialog'
import { useGetSpaceAddressBook } from '@/features/spaces'
import CheckIcon from '@/public/images/common/check.svg'
import classnames from 'classnames'

const AddressBookCard = () => {
  const [open, setOpen] = useState(false)
  const addressBookItems = useGetSpaceAddressBook()

  const handleImport = () => {
    trackEvent({ ...SPACE_EVENTS.IMPORT_ADDRESS_BOOK, label: SPACE_LABELS.space_dashboard_card })
    setOpen(true)
  }

  return (
    <>
      <div className="h-full rounded-3xl bg-card p-6">
        <div className="relative w-full">
          <div className={classnames(css.iconBG, css.iconBGBlue)}>
            <AddressBookIcon className="text-[var(--color-info-main)]" />
          </div>

          {addressBookItems.length > 0 ? (
            <span className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-md bg-[var(--color-success-background)] px-2.5 py-1 text-[var(--color-success-main)]">
              <CheckIcon className="size-4" />
              <Typography variant="paragraph-mini-bold">Done</Typography>
            </span>
          ) : (
            <Button
              onClick={handleImport}
              variant="outline"
              size="lg"
              className="absolute right-0 top-0"
              aria-label="Import address book"
            >
              Import address book
            </Button>
          )}
        </div>
        <div>
          <Typography variant="paragraph-bold" className="mb-2 text-foreground">
            Import address book
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Simplify managing your funds collaboratively by importing your local address book. It will be available to
            all members of the workspace.
          </Typography>
        </div>
      </div>
      {open && <ImportAddressBookDialog handleClose={() => setOpen(false)} />}
    </>
  )
}

export default AddressBookCard
