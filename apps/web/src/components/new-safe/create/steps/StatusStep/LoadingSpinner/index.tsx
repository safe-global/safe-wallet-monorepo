import { useCallback, useEffect, useRef } from 'react'
import { LoadingSpinnerView } from '@views/components/new-safe/create/steps/StatusStep/LoadingSpinner/LoadingSpinnerView'

const rectTlEndTransform = 'translateX(0) translateY(20px) scaleY(1.1)'
const rectTrEndTransform = 'translateX(30px) scaleX(2.3)'
const rectBlEndTransform = 'translateX(30px) translateY(60px) scaleX(2.3)'
const rectBrEndTransform = 'translateY(40px) translateX(60px) scaleY(1.1)'

const moveToEnd = (transformEnd: string, element: HTMLDivElement | null) => {
  if (element) {
    element.getAnimations().forEach((animation) => {
      if ((animation as CSSAnimation).animationName) {
        animation.pause()
      }
    })
    const transformStart = window.getComputedStyle(element).transform
    element.getAnimations().forEach((animation) => {
      if ((animation as CSSAnimation).animationName) {
        animation.cancel()
      }
    })
    element.animate([{ transform: transformStart }, { transform: transformEnd }], {
      duration: 1000,
      easing: 'ease-out',
      fill: 'forwards',
    })
  }
}

export enum SpinnerStatus {
  ERROR = 'isError',
  SUCCESS = 'isSuccess',
  PROCESSING = 'isProcessing',
}

const LoadingSpinner = ({ status }: { status: SpinnerStatus }) => {
  // TODO: only monitoring the PendingTxs we can't determine the transaction's result
  const isError = status === SpinnerStatus.ERROR
  const isSuccess = status === SpinnerStatus.SUCCESS

  const rectTl = useRef<HTMLDivElement>(null)
  const rectTr = useRef<HTMLDivElement>(null)
  const rectBl = useRef<HTMLDivElement>(null)
  const rectBr = useRef<HTMLDivElement>(null)
  const rectCenter = useRef<HTMLDivElement>(null)

  const onFinish = useCallback(() => {
    moveToEnd(rectTlEndTransform, rectTl.current)
    moveToEnd(rectTrEndTransform, rectTr.current)
    moveToEnd(rectBlEndTransform, rectBl.current)
    moveToEnd(rectBrEndTransform, rectBr.current)
  }, [rectBl, rectBr, rectTl, rectTr])

  useEffect(() => {
    if (isSuccess) {
      onFinish()
    }
  }, [isSuccess, onFinish])

  return (
    <LoadingSpinnerView
      isError={isError}
      isSuccess={isSuccess}
      rectTlRef={rectTl}
      rectTrRef={rectTr}
      rectBlRef={rectBl}
      rectBrRef={rectBr}
      rectCenterRef={rectCenter}
    />
  )
}

export default LoadingSpinner
