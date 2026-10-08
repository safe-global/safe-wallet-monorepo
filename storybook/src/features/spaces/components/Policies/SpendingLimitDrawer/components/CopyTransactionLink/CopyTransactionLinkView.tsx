import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import { DrawerFooter } from '@views/components/common/Drawer/components/DrawerFooter'
import { Button } from '@/components/ui/button'

export type CopyTransactionLinkViewProps = {
  copied: boolean
  onCopy: () => void
}

export const CopyTransactionLinkView = ({ copied, onCopy }: CopyTransactionLinkViewProps): ReactElement => (
  <DrawerFooter>
    <Button className="w-full" onClick={onCopy}>
      {copied && <Check data-icon="inline-start" className="text-green-600" />}
      {copied ? 'Copied!' : 'Copy transaction link'}
    </Button>
  </DrawerFooter>
)
