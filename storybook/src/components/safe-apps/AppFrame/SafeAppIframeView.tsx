import type { MutableRefObject, ReactElement } from 'react'
import css from './styles.module.css'

export type SafeAppIframeViewProps = {
  id: string
  iframeRef?: MutableRefObject<HTMLIFrameElement | null>
  src: string
  title?: string
  onLoad?: () => void
  sandbox: string
  allow: string
}

export function SafeAppIframeView({
  id,
  iframeRef,
  src,
  title,
  onLoad,
  sandbox,
  allow,
}: SafeAppIframeViewProps): ReactElement {
  return (
    <iframe
      className={css.iframe}
      id={id}
      ref={iframeRef}
      src={src}
      title={title}
      onLoad={onLoad}
      sandbox={sandbox}
      allow={allow}
    />
  )
}
