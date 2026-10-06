import { useIntervalCounter } from '@safe-global/utils/hooks/useIntervalCounter'
import type { SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { getCheckTiming, type CheckTiming } from './checkTiming'

const TICK_MS = 30_000

/** Time left (or elapsed) for an in-flight check, re-evaluated every 30s for the elapsed fallback. */
export const useCheckTiming = (
  snapshot: SafenetCheckSnapshot,
  startedAtMs: number | null | undefined,
): CheckTiming | null => {
  useIntervalCounter(TICK_MS)
  return getCheckTiming({
    deadlineBlock: snapshot.deadlineBlock,
    headBlock: snapshot.headBlock,
    startedAtMs: snapshot.aimedAtMs ?? startedAtMs ?? null,
    nowMs: Date.now(),
  })
}
