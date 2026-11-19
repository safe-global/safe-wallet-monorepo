import { createContext, useContext } from 'react'
import type { DefiV1Config } from './types'

/** Only the DES-201 prototype stories provide this; without it every component renders as in production. */
export const DefiV1Context = createContext<DefiV1Config | null>(null)

export const useDefiV1 = (): DefiV1Config | null => useContext(DefiV1Context)
