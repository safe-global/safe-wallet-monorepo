import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import css from './styles.module.css'

interface ThresholdProps {
  threshold: number | string
  owners: number | string
}
const Threshold = ({ threshold, owners }: ThresholdProps): ReactElement => (
  <div className={`${css.threshold} text-[var(--color-static-main)]`}>
    {threshold}/{owners}
  </div>
)

export type ChainIconViewProps = {
  chain?: { chainLogoUri?: string | null; chainName: string }
}

export const ChainIconView = ({ chain }: ChainIconViewProps) => {
  if (!chain) {
    return <Skeleton className="size-10 rounded-full" />
  }

  return (
    <img src={chain.chainLogoUri ?? undefined} alt={`${chain.chainName} Logo`} width={40} height={40} loading="lazy" />
  )
}

export type SafeIconViewProps = {
  threshold?: ThresholdProps['threshold']
  owners?: ThresholdProps['owners']
  icon: ReactNode
}

export function SafeIconView({ threshold, owners, icon }: SafeIconViewProps): ReactElement {
  return (
    <div data-testid="safe-icon" className={css.container}>
      {threshold && owners ? <Threshold threshold={threshold} owners={owners} /> : null}
      {icon}
    </div>
  )
}
