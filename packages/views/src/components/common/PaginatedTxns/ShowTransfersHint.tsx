import { Button } from '@safe-global/views/components/ui/button'

const ShowTransfersHint = ({ onShowTransfers }: { onShowTransfers: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-8 text-center">
    <p className="text-muted-foreground">Paid this address in tokens or in a batch?</p>
    <Button variant="outline" onClick={onShowTransfers}>
      Show transfers
    </Button>
  </div>
)

export default ShowTransfersHint
