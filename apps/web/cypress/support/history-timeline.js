/**
 * Maps a date of a staging history to the same point in the rebuilt history. `timeline` holds pairs of
 * [staging time, local time] in ms, oldest first; between pairs the time is interpolated, outside them shifted.
 */
export function timelineDate(value, timeline) {
  if (!timeline.length) return value
  const time = Date.parse(value)
  const before = timeline.findLast(([staging]) => staging <= time)
  const after = timeline.find(([staging]) => staging > time)
  if (!before) return new Date(after[1] - (after[0] - time)).toISOString()
  if (!after) return new Date(before[1] + (time - before[0])).toISOString()
  const ratio = (time - before[0]) / (after[0] - before[0])
  return new Date(Math.round(before[1] + ratio * (after[1] - before[1]))).toISOString()
}
