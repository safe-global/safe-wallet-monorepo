/**
 * Runs `onTimeout` after `delay` ms, but only counts down while the tab is visible.
 *
 * A backgrounded tab throttles timers and defers React renders, so a plain `setTimeout`
 * can fire before the work it guards has had a chance to complete — making time-based
 * bail/timeout logic misbehave on tab return. This pauses the countdown while the tab is
 * hidden and re-arms it from scratch each time the tab becomes visible again.
 *
 * @returns a cleanup function that cancels the timer and removes the listener.
 */
export const scheduleWhileVisible = (delay: number, onTimeout: () => void): (() => void) => {
  // SSR / non-DOM environments: fall back to a plain timeout.
  if (typeof document === 'undefined') {
    const timer = setTimeout(onTimeout, delay)
    return () => clearTimeout(timer)
  }

  let timer: ReturnType<typeof setTimeout> | undefined

  // Cancels any pending countdown, then starts a fresh one only if the tab is visible.
  // Used both to kick things off and as the visibilitychange handler: becoming visible
  // (re)starts the full delay, becoming hidden just cancels it.
  const restartCountdown = () => {
    clearTimeout(timer)
    if (document.visibilityState !== 'visible') return
    timer = setTimeout(onTimeout, delay)
  }

  restartCountdown()
  document.addEventListener('visibilitychange', restartCountdown)

  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', restartCountdown)
  }
}
