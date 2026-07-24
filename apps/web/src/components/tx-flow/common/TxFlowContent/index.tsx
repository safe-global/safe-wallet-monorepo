import { TxFlowContext } from '../../TxFlowProvider'
import { type ReactNode, useContext } from 'react'
import TxLayoutBase from '../TxLayoutBase'
import { Slot, SlotName } from '../../slots'

/**
 * Context-driven entry point for the slot-based transaction flows (the ones built on
 * TxFlow / TxFlowProvider). It reads the layout state from TxFlowContext and delegates the
 * rendering to the shared {@link TxLayoutBase} chrome, adding the sidebar slot. Providers are
 * set up by TxFlow above this component, so none are wired here.
 */
export const TxFlowContent = ({ children }: { children?: ReactNode[] | ReactNode }) => {
  const {
    txLayoutProps: {
      title = '',
      subtitle,
      txSummary,
      icon,
      fixedNonce,
      hideNonce,
      hideProgress,
      isReplacement,
      isMessage,
    },
    isBatch,
    step,
    progress,
    onPrev,
  } = useContext(TxFlowContext)
  const childrenArray = Array.isArray(children) ? children : [children]

  return (
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
      step={step}
      stepCount={childrenArray.length}
      progress={progress}
      onBack={onPrev}
      sidebarSlot={<Slot name={SlotName.Sidebar} />}
    >
      {childrenArray[step]}
    </TxLayoutBase>
  )
}
