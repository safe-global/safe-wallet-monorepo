import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type ComponentType, type ReactElement, type ReactNode, useContext } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsBelowMd } from '@/hooks/useMediaQuery'
import { useDarkMode } from '@/hooks/useDarkMode'
import { SafeTxContext } from '../../SafeTxProvider'
import TxNonce from '../TxNonce'
import TxStatusWidget from '../TxStatusWidget'
import SafeShieldWidget from '@/features/safe-shield'
import { TxLayoutBaseView, TxLayoutHeaderView } from '@views/components/tx-flow/common/TxLayoutBase/TxLayoutBaseView'

export const TxLayoutHeader = ({
  hideNonce,
  fixedNonce,
  icon,
  subtitle,
}: {
  hideNonce?: boolean
  fixedNonce?: boolean
  icon?: ComponentType
  subtitle?: ReactNode
}) => {
  const { safe } = useSafeInfo()
  const { nonceNeeded } = useContext(SafeTxContext)

  if (hideNonce && !icon && !subtitle) return null

  return (
    <TxLayoutHeaderView
      icon={icon}
      subtitle={subtitle}
      nonce={!hideNonce && safe.deployed && nonceNeeded && <TxNonce canEdit={!fixedNonce} />}
    />
  )
}

export type TxLayoutBaseProps = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
  txSummary?: Transaction
  hideNonce?: boolean
  fixedNonce?: boolean
  hideProgress?: boolean
  isReplacement?: boolean
  isMessage?: boolean
  isBatch?: boolean
  hideSafeShield?: boolean
  /** Drops the left status rail — for flows that produce no transaction (e.g. policy grants). */
  hideStatusRail?: boolean
  /** Zero-based index of the step being shown. */
  step: number
  /** Total number of steps, used to flag the last step to the status widget. */
  stepCount: number
  /** Completion percentage for the progress bar. */
  progress: number
  /** Back handler; the button only renders when set and not on the first step. */
  onBack?: () => void
  /** The current step's content. */
  children: ReactNode
  /** Optional extra content rendered under the Safe Shield widget (used by the slot-based flows). */
  sidebarSlot?: ReactNode
}

/**
 * The presentational chrome shared by every transaction flow: the status rail, the titled
 * card with progress bar + header, the step content, and the Safe Shield sidebar. It is
 * source-agnostic — {@link TxLayout} feeds it from props (and wraps the providers), while
 * TxFlowContent feeds it from TxFlowContext (and passes the sidebar slot). Keep the provider
 * wiring OUT of here so both entry points can own their own context setup.
 */
const TxLayoutBase = ({
  title,
  subtitle,
  icon,
  txSummary,
  hideNonce = false,
  fixedNonce = false,
  hideProgress = false,
  isReplacement = false,
  isMessage = false,
  isBatch = false,
  hideSafeShield = false,
  hideStatusRail = false,
  step,
  stepCount,
  progress,
  onBack,
  children,
  sidebarSlot,
}: TxLayoutBaseProps): ReactElement => {
  const isSmallScreen = useIsBelowMd()
  const isDarkMode = useDarkMode()

  return (
    <TxLayoutBaseView
      title={title}
      hideProgress={hideProgress}
      isReplacement={isReplacement}
      hideSafeShield={hideSafeShield}
      hideStatusRail={hideStatusRail}
      isSmallScreen={isSmallScreen}
      isDarkMode={isDarkMode}
      step={step}
      progress={progress}
      onBack={onBack}
      sidebarSlot={sidebarSlot}
      statusWidget={
        <TxStatusWidget
          isLastStep={step === stepCount - 1}
          txSummary={txSummary}
          isBatch={isBatch}
          isMessage={isMessage}
        />
      }
      header={<TxLayoutHeader subtitle={subtitle} icon={icon} hideNonce={hideNonce} fixedNonce={fixedNonce} />}
      safeShield={<SafeShieldWidget />}
    >
      {children}
    </TxLayoutBaseView>
  )
}

export default TxLayoutBase
