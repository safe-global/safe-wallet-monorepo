import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { SpaceInfoModalView, TOTAL_TREASURY } from '@views/features/spaces/components/SpaceInfoModal/SpaceInfoModalView'

/** Eases a number up to the total treasury value once on mount. */
const useCountUp = (target: number, enabled: boolean, duration = 1400, delay = 480) => {
  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) return

    let frame = 0
    const start = performance.now() + delay
    const step = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        frame = requestAnimationFrame(step)
        return
      }
      const t = Math.min(elapsed / duration, 1)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.floor(target * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
  }, [target, enabled, duration, delay])

  return value
}

const SpaceInfoModal = ({ onClose }: { onClose: () => void }) => {
  const reduceMotion = useReducedMotion() ?? false
  const total = useCountUp(TOTAL_TREASURY, !reduceMotion)

  return <SpaceInfoModalView reduceMotion={reduceMotion} total={total} onClose={onClose} />
}

export default SpaceInfoModal
