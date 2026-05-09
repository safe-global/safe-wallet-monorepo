import { LedgerProgress } from '@/src/features/Ledger/components/LedgerProgress'

interface PairingProgressProps {
  deviceName: string
}

export const PairingProgress = ({ deviceName }: PairingProgressProps) => {
  return (
    <LedgerProgress
      title={`Pairing with ${deviceName}...`}
      description="Please confirm the pairing request on your Ledger device"
    />
  )
}
