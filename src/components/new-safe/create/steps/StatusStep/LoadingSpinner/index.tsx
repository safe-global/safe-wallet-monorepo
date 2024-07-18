import { Box, SvgIcon } from '@mui/material'
import css from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner/styles.module.css'
import classnames from 'classnames'
import { useCallback, useEffect, useRef } from 'react'
import SuperChainStar from '@/public/images/common/superchain-star.svg'
import SuperChainBrokenStart from '@/public/images/common/superchain-star-broken.svg'

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

  // const rectTl = useRef<HTMLDivElement>(null)
  // const rectTr = useRef<HTMLDivElement>(null)
  // const rectBl = useRef<HTMLDivElement>(null)
  // const rectBr = useRef<HTMLDivElement>(null)
  // const rectCenter = useRef<HTMLDivElement>(null)

  // const onFinish = useCallback(() => {
  //   moveToEnd(rectTlEndTransform, rectTl.current)
  //   moveToEnd(rectTrEndTransform, rectTr.current)
  //   moveToEnd(rectBlEndTransform, rectBl.current)
  //   moveToEnd(rectBrEndTransform, rectBr.current)
  // }, [rectBl, rectBr, rectTl, rectTr])

  // useEffect(() => {
  //   if (isSuccess) {
  //     onFinish()
  //   }
  // }, [isSuccess, onFinish])

  return (
    <Box className={classnames(css.box, { [css.rectError]: isError }, { [css.rectSuccess]: isSuccess })}>
      {/* <div className={classnames(css.rect, css.rectTl)} ref={rectTl} />
      <div className={classnames(css.rect, css.rectTr)} ref={rectTr} />
      <div className={classnames(css.rect, css.rectBl)} ref={rectBl} />
      <div className={classnames(css.rect, css.rectBr)} ref={rectBr} />
      <div className={classnames(css.rect, css.rectCenter)} ref={rectCenter} />

      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg> */}
      {isError ? <SvgIcon component={SuperChainBrokenStart} inheritViewBox fontSize="inherit" />

        : <SvgIcon className={css.spin} component={SuperChainStar} inheritViewBox fontSize="inherit" />
      }
    </Box>
  )
}

export default LoadingSpinner
