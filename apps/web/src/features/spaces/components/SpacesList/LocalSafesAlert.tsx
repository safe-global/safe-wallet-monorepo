import { WalletMinimal } from 'lucide-react'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'

const LocalSafesAlert = () => {
  const allAdded = useAppSelector(selectAllAddedSafes)
  const count = Object.values(allAdded ?? {}).reduce((sum, safes) => sum + Object.keys(safes).length, 0)

  if (count === 0) return null

  return (
    <div
      data-testid="local-safes-alert"
      className="mb-5 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3 text-left dark:border-green-900/40 dark:bg-green-950/40"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#12ff80] text-[#0a0a0a]">
        <WalletMinimal size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold leading-5 text-foreground">
          {count} {count === 1 ? 'Safe' : 'Safes'} detected on this browser
        </p>
        <p className="text-[13px] leading-[18px] text-muted-foreground">Sign in to resume where you left off.</p>
      </div>
    </div>
  )
}

export default LocalSafesAlert
