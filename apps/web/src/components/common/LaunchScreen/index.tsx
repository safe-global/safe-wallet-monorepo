import { useEffect, useState, type ReactElement } from 'react'
import { LAUNCH_STEPS, LaunchScreenView } from '@views/components/common/LaunchScreen/LaunchScreenView'
import { useLaunchScreen } from './useLaunchScreen'

const STEP_INTERVAL_MS = 700
const EXIT_DURATION_MS = 300

/**
 * Mounted once in `_app` so it never replays on a client-side navigation.
 *
 * @see {@link useLaunchScreen} for when it hides.
 */
function LaunchScreen({ stepUpCaption }: { stepUpCaption?: string }): ReactElement | null {
  const { visible } = useLaunchScreen()
  const [rendered, setRendered] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!visible) return
    const id = setInterval(
      () => setStepIndex((index) => Math.min(index + 1, LAUNCH_STEPS.length - 1)),
      STEP_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [visible])

  useEffect(() => {
    if (visible) return
    const id = setTimeout(() => setRendered(false), EXIT_DURATION_MS)
    return () => clearTimeout(id)
  }, [visible])

  const heldForStepUp = Boolean(stepUpCaption)

  if (!rendered && !heldForStepUp) return null

  const exiting = !visible && !heldForStepUp

  return (
    <LaunchScreenView
      exiting={exiting}
      heldForStepUp={heldForStepUp}
      stepIndex={stepIndex}
      stepUpCaption={stepUpCaption}
    />
  )
}

export default LaunchScreen
