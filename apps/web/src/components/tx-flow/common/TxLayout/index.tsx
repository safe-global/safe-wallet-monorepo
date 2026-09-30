import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ComponentType, type ReactElement, type ReactNode } from 'react'
import SafeTxProvider from '../../SafeTxProvider'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import TxLayoutBase from '../TxLayoutBase'

// Re-exported for backwards compatibility; the header now lives with the shared chrome.
export { TxLayoutHeader } from '../TxLayoutBase'

type TxLayoutProps = {
  title: ReactNode
  children: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  step?: number
  txSummary?: Transaction
  onBack?: () => void
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isBatch?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  hideSafeShield?: boolean
}

/**
 * Prop-driven entry point for the standalone transaction flows (Replace, Recover, Batch,
 * Sign message, Recovery attempt, Activate account). It owns the tx providers and computes
 * step progress, then delegates the rendering to the shared {@link TxLayoutBase} chrome.
 */
const TxLayout = ({
  title,
  subtitle,
  icon,
  children,
  step = 0,
  txSummary,
  onBack,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isBatch = false,
  isReplacement = false,
  isMessage = false,
  hideSafeShield = false,
}: TxLayoutProps): ReactElement => {
  const steps = Array.isArray(children) ? children : [children]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <SafeShieldProvider>
          <TxLayoutBase
            title={title}
            subtitle={subtitle}
            icon={icon}
            txSummary={txSummary}
            hideNonce={hideNonce}
            fixedNonce={fixedNonce}
            hideProgress={hideProgress}
            isReplacement={isReplacement}
            isMessage={isMessage}
            isBatch={isBatch}
            hideSafeShield={hideSafeShield}
            step={step}
            stepCount={steps.length}
            progress={progress}
            onBack={onBack}
          >
            {steps[step]}
          </TxLayoutBase>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}

export default TxLayout
