import { LedgerProgress } from '@/src/features/Ledger/components/LedgerProgress'

export const ScanningProgress = () => {
  return (
    <LedgerProgress
      title="Looking for devices nearby...."
      description="Keep your device nearby to get the best signal"
    />
  )
}
