import { MODAL_NAVIGATION, trackEvent } from '@/services/analytics'
import { useCallback, useState, useEffect } from 'react'
import { saveTxFlowState } from './txFlowStorage'

const useTxStepper = <T extends unknown>(
  initialData: T,
  eventCategory?: string,
  flowType?: string,
  txId?: string,
  txNonce?: number,
) => {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<T>(initialData)

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (flowType && (step > 0 || data !== initialData)) {
      saveTxFlowState(flowType, step, data, txId, txNonce)
    }
  }, [flowType, step, data, txId, txNonce, initialData])

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

  return { step, data, nextStep, prevStep, setStep, setData }
}

export default useTxStepper
