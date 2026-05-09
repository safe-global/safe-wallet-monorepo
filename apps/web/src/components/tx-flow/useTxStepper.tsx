import { MODAL_NAVIGATION, trackEvent } from '@/services/analytics'
import { useCallback, useState } from 'react'

const useTxStepper = <T extends unknown>(initialData: T, eventCategory?: string) => {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<T>(initialData)

  const nextStep = useCallback(
    (entireData?: T) => {
      if (entireData) setData(entireData)

      setStep((prevStep) => {
        if (eventCategory) {
          trackEvent({ action: MODAL_NAVIGATION.Next, category: eventCategory, label: prevStep })
        }

        return prevStep + 1
      })
    },
    [eventCategory],
  )

  const prevStep = useCallback(() => {
    setStep((prevStep) => {
      if (eventCategory) {
        trackEvent({ action: MODAL_NAVIGATION.Back, category: eventCategory, label: prevStep })
      }
      return prevStep - 1
    })
  }, [eventCategory])

  return { step, data, nextStep, prevStep }
}

export default useTxStepper
