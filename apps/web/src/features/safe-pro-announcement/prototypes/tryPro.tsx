import { createContext, useCallback, useContext, useState, type ReactElement, type ReactNode } from 'react'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { TryProModal } from './TryProModal'

export const TRY_PRO_REASONS = {
  sponsored: 'Safe Pro includes 50 sponsored transactions a month, so your team never pays gas.',
  signing: 'With Safe Pro your co-signers share one queue and get notified when it’s their turn.',
  recipient: 'Safe Pro checks every recipient against your address book and past transactions.',
  contract: 'Safe Pro checks every contract you interact with before you sign.',
}

type OpenTryPro = (reason: string) => void

const TryProContext = createContext<OpenTryPro | undefined>(undefined)

/** Undefined outside a {@link TryProProvider}, so production prompts keep linking to the plans page. */
export const useTryPro = (): OpenTryPro | undefined => useContext(TryProContext)

export const TryProProvider = ({
  tiers,
  safeCount,
  children,
}: {
  tiers: PlanTier[]
  safeCount: number
  children: ReactNode
}): ReactElement => {
  const [reason, setReason] = useState<string>()
  const close = useCallback(() => setReason(undefined), [])

  return (
    <TryProContext.Provider value={setReason}>
      {children}
      {reason && <TryProModal tiers={tiers} safeCount={safeCount} reason={reason} onClose={close} />}
    </TryProContext.Provider>
  )
}
