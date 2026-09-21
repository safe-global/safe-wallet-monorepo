import { Download } from 'lucide-react'
import { useAddressBooksGetAddressBookItemsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { downloadCsv, spaceAddressBookToCsv } from '../../utils/addressBookCsv'

/** Saves the Workspace's shared address book as CSV, so nothing is lost while the Workspace is locked. */
export default function DownloadAddressBookButton({ spaceId }: { spaceId: string }) {
  const { currentData, isLoading } = useAddressBooksGetAddressBookItemsV1Query({ spaceId })
  const items = currentData?.data ?? []

  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={isLoading || items.length === 0}
      onClick={() => downloadCsv(`workspace-${spaceId}-address-book.csv`, spaceAddressBookToCsv(items))}
      data-testid="download-address-book"
    >
      <Download data-icon="inline-start" />
      Download shared address book
    </Button>
  )
}
