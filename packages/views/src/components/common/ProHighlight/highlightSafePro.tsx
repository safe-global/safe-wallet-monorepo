import type { ReactNode } from 'react'
import { ProHighlight } from './index'

const SAFE_PRO = 'Safe Pro'

export const highlightSafePro = (text: string): ReactNode => {
  const parts = text.split(SAFE_PRO)
  if (parts.length === 1) return text
  return parts.flatMap((part, index) =>
    index === 0 ? [part] : [<ProHighlight key={index}>{SAFE_PRO}</ProHighlight>, part],
  )
}
