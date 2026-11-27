import { useContext } from 'react'
import { AppsV1Context, type AppsV1Config } from '../../defiV1/apps/context'

/** The DES-201 Apps prototype config, or null outside its story, where the Apps page renders as in production. */
export const useAppsV1 = (): AppsV1Config | null => useContext(AppsV1Context)
