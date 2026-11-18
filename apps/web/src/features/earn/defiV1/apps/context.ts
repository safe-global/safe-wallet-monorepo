import { createContext, useContext } from 'react'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

export type AppsView = 'table' | 'grid'

export type AppsV1Config = { view: AppsView; customApps?: SafeApp[] }

/** Only the DES-201 Apps prototype story provides this; without it the Apps page renders as in production. */
export const AppsV1Context = createContext<AppsV1Config | null>(null)

export const useAppsV1 = (): AppsV1Config | null => useContext(AppsV1Context)
