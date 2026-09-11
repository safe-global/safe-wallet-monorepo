import TxCard from '@/components/tx-flow/common/TxCard'
import { Typography } from '@/components/ui/typography'

const ErrorTransactionPreview = () => (
  <TxCard>
    <div className="mb-10 flex min-h-[38svh] items-center justify-center" data-testid="error-transaction-preview">
      <Typography variant="paragraph-bold">Error loading preview. Please try again.</Typography>
    </div>
  </TxCard>
)

export default ErrorTransactionPreview
