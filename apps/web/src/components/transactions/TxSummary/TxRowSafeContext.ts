import { createContext, useContext } from 'react'

export type TxRowSafe = { chainId: string; safeAddress: string }

/** Set where a list mixes several Safes (a Space queue), so each row names the Safe it belongs to. */
export const TxRowSafeContext = createContext<TxRowSafe | undefined>(undefined)

export const useTxRowSafe = (): TxRowSafe | undefined => useContext(TxRowSafeContext)
