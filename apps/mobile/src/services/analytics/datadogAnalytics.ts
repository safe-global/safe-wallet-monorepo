import { DdRum } from 'expo-datadog'

let previousViewKey: string | null = null
let isViewActive = false

/**
 * Track screen views in Datadog RUM.
 * Automatically stops the previous view before starting a new one.
 */
export const trackDatadogView = (viewKey: string, viewName: string): void => {
  if (previousViewKey && previousViewKey !== viewKey) {
    DdRum.stopView(previousViewKey)
  }

  DdRum.startView(viewKey, viewName)
  previousViewKey = viewKey
  isViewActive = true
}

/**
 * Stop the active RUM view when the app goes to the background.
 *
 * React Native's RUM SDK derives JS long tasks from frame-time deltas. On iOS
 * the detector is never paused while suspended, so the first frame after resume
 * is measured against the pre-suspension timestamp and reported as a single
 * `is_frozen_frame` long task spanning the whole background interval. Dropping
 * the active view here means that stale-frame long task has no view to attach
 * to and is discarded by the SDK.
 */
export const stopActiveDatadogView = (): void => {
  if (previousViewKey && isViewActive) {
    DdRum.stopView(previousViewKey)
    isViewActive = false
  }
}

/**
 * Restart the last view when the app returns to the foreground. The navigation
 * effect does not re-fire on resume (the pathname is unchanged), so the view
 * must be restarted explicitly. Reusing the key is safe — the SDK starts a
 * fresh view instance per `startView`.
 */
export const resumeActiveDatadogView = (): void => {
  if (previousViewKey && !isViewActive) {
    DdRum.startView(previousViewKey, previousViewKey)
    isViewActive = true
  }
}

/** Test-only: reset module state between cases. */
export const __resetDatadogViewStateForTests = (): void => {
  previousViewKey = null
  isViewActive = false
}
