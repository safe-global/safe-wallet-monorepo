import { useContext } from 'react'
import { DefiV1Context } from '../../defiV1/context'
import type { DefiV1Config } from '../../defiV1/types'

/** The DES-201 prototype config, or null outside its stories, where everything renders as in production. */
export const useDefiV1 = (): DefiV1Config | null => useContext(DefiV1Context)
