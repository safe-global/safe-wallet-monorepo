import local from '@/services/local-storage/local'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

export const APPS_DASHBOARD = 'SafeApps__dashboard'

const TX_COUNT_WEIGHT = 2
const OPEN_COUNT_WEIGHT = 1

export type AppTrackData = {
  [safeAppId: string]: {
    timestamp: number
    openCount: number
    txCount: number
  }
}

export const getAppsUsageData = (): AppTrackData => {
  return local.getItem<AppTrackData>(APPS_DASHBOARD) || {}
}

export const trackSafeAppOpenCount = (id: SafeAppData['id']): void => {
  const trackData = getAppsUsageData()
  const currentOpenCount = trackData[id]?.openCount ?? 0
  const currentTxCount = trackData[id]?.txCount ?? 0

  local.setItem(APPS_DASHBOARD, {
    ...trackData,
    [id]: {
      timestamp: Date.now(),
      openCount: currentOpenCount + 1,
      txCount: currentTxCount,
    },
  })
}

export const trackSafeAppTxCount = (id: SafeAppData['id']): void => {
  const trackData = getAppsUsageData()
  const currentTxCount = trackData[id]?.txCount ?? 0

  local.setItem(APPS_DASHBOARD, {
    ...trackData,
    // The object contains the openCount when we are creating a transaction
    [id]: { ...trackData[id], txCount: currentTxCount + 1 },
  })
}

// https://stackoverflow.com/a/55212064
const normalizeBetweenTwoRanges = (
  val: number,
  minVal: number,
  maxVal: number,
  newMin: number,
  newMax: number,
): number => {
  return newMin + ((val - minVal) * (newMax - newMin)) / (maxVal - minVal)
}

export const rankSafeApps = (safeApps: SafeAppData[]) => {
  const apps = getAppsUsageData()
  const appsWithScore = computeTrackedSafeAppsScore(apps)

  return Object.entries(appsWithScore)
    .sort((a, b) => b[1] - a[1])
    .map((app) => safeApps.find((safeApp) => String(safeApp.id) === app[0]))
    .filter(Boolean) as SafeAppData[]
}

export const computeTrackedSafeAppsScore = (apps: AppTrackData): Record<string, number> => {
  const scoredApps: Record<string, number> = {}

  const sortedByTimestamp = Object.entries(apps).sort((a, b) => {
    return a[1].timestamp - b[1].timestamp
  })

  for (const [idx, app] of Array.from(sortedByTimestamp.entries())) {
    // UNIX Timestamps add too much weight, so we normalize by uniformly distributing them to range [1..2]
    const timeMultiplier = normalizeBetweenTwoRanges(idx, 0, sortedByTimestamp.length, 1, 2)

    scoredApps[app[0]] = (TX_COUNT_WEIGHT * app[1].txCount + OPEN_COUNT_WEIGHT * app[1].openCount) * timeMultiplier
  }

  return scoredApps
}
