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
      className="mb-5 flex items-center gap-3 rounded-xl border p-3 text-left"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-static-text-brand) 8%, transparent)',
        borderColor: 'color-mix(in srgb, var(--color-static-text-brand) 35%, transparent)',
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#0a0a0a]"
        style={{ backgroundColor: 'var(--color-static-text-brand)' }}
      >
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
