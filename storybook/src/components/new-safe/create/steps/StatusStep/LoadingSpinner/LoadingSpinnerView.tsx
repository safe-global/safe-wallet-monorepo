import type { ReactElement, Ref } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'

export type LoadingSpinnerViewProps = {
  isError: boolean
  isSuccess: boolean
  rectTlRef: Ref<HTMLDivElement>
  rectTrRef: Ref<HTMLDivElement>
  rectBlRef: Ref<HTMLDivElement>
  rectBrRef: Ref<HTMLDivElement>
  rectCenterRef: Ref<HTMLDivElement>
}

export function LoadingSpinnerView({
  isError,
  isSuccess,
  rectTlRef,
  rectTrRef,
  rectBlRef,
  rectBrRef,
  rectCenterRef,
}: LoadingSpinnerViewProps): ReactElement {
  return (
    <div className={classnames(css.box, { [css.rectError]: isError }, { [css.rectSuccess]: isSuccess })}>
      <div className={classnames(css.rect, css.rectTl)} ref={rectTlRef} />
      <div className={classnames(css.rect, css.rectTr)} ref={rectTrRef} />
      <div className={classnames(css.rect, css.rectBl)} ref={rectBlRef} />
      <div className={classnames(css.rect, css.rectBr)} ref={rectBrRef} />
      <div className={classnames(css.rect, css.rectCenter)} ref={rectCenterRef} />

      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  )
}
