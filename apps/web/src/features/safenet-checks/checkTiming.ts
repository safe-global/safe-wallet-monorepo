import { BLOCK_TIME_SECONDS } from '@safe-global/utils/features/safenet-checks/constants'

/** `remaining` is an upper bound (blocks to the reveal deadline); `elapsed` is the fallback. */
export type CheckTiming = { kind: 'remaining'; minutes: number } | { kind: 'elapsed'; minutes: number }

type CheckTimingInput = {
  deadlineBlock: string | null
  headBlock: string | null
  startedAtMs: number | null
  nowMs: number
}

export const getCheckTiming = ({
  deadlineBlock,
  headBlock,
  startedAtMs,
  nowMs,
}: CheckTimingInput): CheckTiming | null => {
  if (deadlineBlock !== null && headBlock !== null) {
    const blocksLeft = BigInt(deadlineBlock) - BigInt(headBlock)
    if (blocksLeft > 0n) {
      return { kind: 'remaining', minutes: Math.ceil((Number(blocksLeft) * BLOCK_TIME_SECONDS) / 60) }
    }
  }

  if (startedAtMs === null || nowMs < startedAtMs) return null
  return { kind: 'elapsed', minutes: Math.floor((nowMs - startedAtMs) / 60_000) }
}

/** Second line of the flow section, e.g. "Up to about 2 min left." */
export const formatTimingSentence = (timing: CheckTiming | null): string | null => {
  if (!timing) return null
  if (timing.kind === 'remaining') {
    return timing.minutes <= 1 ? 'Less than a minute left.' : `Up to about ${timing.minutes} min left.`
  }
  return timing.minutes < 1 ? 'Started just now.' : `Started ${timing.minutes} min ago.`
}

/** Compact in-progress label for the queue and the audit log, e.g. "Simulating · up to ~2 min". */
export const formatSimulatingLabel = (timing: CheckTiming | null): string => {
  if (!timing) return 'Simulating'
  if (timing.kind === 'remaining') {
    return timing.minutes <= 1 ? 'Simulating · under 1 min' : `Simulating · up to ~${timing.minutes} min`
  }
  return timing.minutes < 1 ? 'Simulating' : `Simulating for ${timing.minutes} min`
}
