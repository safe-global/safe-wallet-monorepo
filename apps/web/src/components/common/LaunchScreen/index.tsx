import { useEffect, useState, type ReactElement } from 'react'
import { useLaunchScreen } from './useLaunchScreen'
import LaunchScreenView from './LaunchScreenView'

// Decorative, time-driven steps — boot has no granular progress signal, so this is purely cosmetic.
const LAUNCH_STEPS = [
  { progress: 30, caption: 'Loading your workspace…' },
  { progress: 65, caption: 'Fetching your accounts…' },
  { progress: 90, caption: 'Almost there…' },
] as const

const STEP_INTERVAL_MS = 700
const EXIT_DURATION_MS = 300

/**
 * App-boot launch screen. Renders a full-screen branded splash from first mount until the
 * app shell is ready (see {@link useLaunchScreen}), then fades out and unmounts. Mounted once
 * in `_app`, so it never replays on client-side navigations.
 */
function LaunchScreen(): ReactElement | null {
  const { visible } = useLaunchScreen()
  const [rendered, setRendered] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  // Advance the decorative steps while visible.
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      setStepIndex((index) => Math.min(index + 1, LAUNCH_STEPS.length - 1))
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [visible])

  // Keep mounted through the fade-out, then unmount.
  useEffect(() => {
    if (visible) return
    const id = setTimeout(() => setRendered(false), EXIT_DURATION_MS)
    return () => clearTimeout(id)
  }, [visible])

  if (!rendered) return null

  const step = LAUNCH_STEPS[stepIndex]
  // Snap to 100% during the exit fade so the bar reads as complete.
  return <LaunchScreenView progress={visible ? step.progress : 100} caption={step.caption} exiting={!visible} />
}

export default LaunchScreen
