import { Button } from '@safe-global/views/components/ui/button'

const ShowTransfersHint = ({ onShowTransfers }: { onShowTransfers: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-8 text-center">
    <p className="text-muted-foreground">Can&apos;t find a payment?</p>
    <Button onClick={onShowTransfers}>Show payments</Button>
  </div>
)

export default ShowTransfersHint
