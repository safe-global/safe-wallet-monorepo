import { createContext } from 'react'
import type { GasPayerSelection } from '@/features/fee-payment'

/**
 * Who pays the fee at the sign step, computed once per flow by `FeePayerProvider`: the fee card shows it
 * and signing reads it, so nothing needs syncing. Null outside a tx flow. Kept free of runtime imports
 * beyond `react` so the signing hooks can read it without an import cycle.
 */
export const FeePayerContext = createContext<GasPayerSelection | null>(null)
