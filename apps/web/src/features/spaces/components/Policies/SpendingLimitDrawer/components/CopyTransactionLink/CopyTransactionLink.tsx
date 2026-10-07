import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import { DrawerFooter } from '@/components/common/Drawer'
import { Button } from '@/components/ui/button'
import useCopyToClipboard from '@/hooks/useCopyToClipboard'

export type CopyTransactionLinkProps = {
  transactionLink: string
}

const CopyTransactionLink = ({ transactionLink }: CopyTransactionLinkProps): ReactElement => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <DrawerFooter>
      <Button className="w-full" onClick={() => copy(transactionLink)}>
        {copied && <Check data-icon="inline-start" className="text-green-600" />}
        {copied ? 'Copied!' : 'Copy transaction link'}
      </Button>
    </DrawerFooter>
  )
}

export default CopyTransactionLink
