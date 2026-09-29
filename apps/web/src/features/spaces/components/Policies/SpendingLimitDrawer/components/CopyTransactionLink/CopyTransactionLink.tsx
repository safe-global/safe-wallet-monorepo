import type { ReactElement } from 'react'
import { DrawerFooter } from '@/components/common/Drawer'
import CopyButton from '@/components/common/CopyButton'
import { Button } from '@/components/ui/button'

export type CopyTransactionLinkProps = {
  transactionLink: string
}

const CopyTransactionLink = ({ transactionLink }: CopyTransactionLinkProps): ReactElement => (
  <DrawerFooter>
    <div className="flex *:w-full">
      <CopyButton text={transactionLink} initialToolTipText="Copy transaction link">
        <Button className="w-full">Copy transaction link</Button>
      </CopyButton>
    </div>
  </DrawerFooter>
)

export default CopyTransactionLink
