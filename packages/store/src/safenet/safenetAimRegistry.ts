import { checkKey, type CheckIdentity } from './safenetCheckSlice'

/**
 * The submission time each check's block window is aimed at: the earliest
 * timestamp any surface has offered for that check.
 *
 * Every surface rendering one check shares a single cache entry and a single
 * poll loop, so exactly one timestamp can aim the read. RTK Query replays the
 * arguments of the fetch that created the entry, so without a canonical rule
 * the surface that mounted first would aim every later poll. Every shipped
 * surface offers the transaction's submission date today, which makes the fold
 * a no-op; the rule is here so a surface offering a later surrogate cannot pin
 * a worse aim. Earliest wins because the events the read looks for are emitted
 * at or after the submission.
 *
 * Deliberately not a Redux slice: nothing renders from it, it must never be
 * persisted, and {@link recordAim} has to answer "what is the aim now" inside a
 * render pass, which a dispatch cannot. The `getSafenetCheck` endpoint forgets
 * an aim when its cache entry is evicted; an aim recorded by a render React
 * discarded before commit has no entry to be forgotten with, so it stays for
 * the session — one bounded Map entry per check rendered, freed on unload, and
 * always in the safe direction, since a leaked aim can only be earlier.
 */
const aims = new Map<string, number>()

const isUsableAim = (timestampMs: number | null | undefined): timestampMs is number =>
  timestampMs != null && Number.isFinite(timestampMs) && timestampMs > 0

/**
 * Offer a submission time for a check and return the aim every read of it now
 * uses, or null when no surface has offered a usable one. Idempotent: the
 * registry keeps the minimum, so repeating an offer, or making a later one,
 * changes nothing.
 */
export const recordAim = (identity: CheckIdentity, timestampMs: number | null | undefined): number | null => {
  const key = checkKey(identity)
  const current = aims.get(key)
  if (!isUsableAim(timestampMs)) return current ?? null
  if (current !== undefined && current <= timestampMs) return current
  aims.set(key, timestampMs)
  return timestampMs
}

/** The aim a read of this check must use, or null when none was ever offered. */
export const resolveAim = (identity: CheckIdentity): number | null => aims.get(checkKey(identity)) ?? null

/** Drop a check's aim. The next subscriber rebuilds it from its own offer. */
export const forgetAim = (identity: CheckIdentity): void => {
  aims.delete(checkKey(identity))
}
