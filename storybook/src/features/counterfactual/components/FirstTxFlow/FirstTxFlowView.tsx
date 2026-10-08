import ModalDialog from '@/components/common/ModalDialog'
import ChoiceButton from '@/components/common/ChoiceButton'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import SwapIcon from '@/public/images/common/swap.svg'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { Wrench } from 'lucide-react'

export type FirstTxFlowViewProps = {
  open: boolean
  onClose: () => void
  showRecoveryOption: boolean
  showCustomTransaction: boolean
  onActivateSafe: () => void
  onAddSigner: () => void
  onRecovery: () => void
  onSwap: () => void
  onCustomTransaction: () => void
  onSendToken: () => void
}

export const FirstTxFlowView = ({
  open,
  onClose,
  showRecoveryOption,
  showCustomTransaction,
  onActivateSafe,
  onAddSigner,
  onRecovery,
  onSwap,
  onCustomTransaction,
  onSendToken,
}: FirstTxFlowViewProps) => {
  return (
    <ModalDialog open={open} dialogTitle="Create new transaction" hideChainIndicator onClose={onClose}>
      <div className="flex flex-col justify-center gap-4 p-6">
        <div>
          <ChoiceButton
            title="Activate Safe now"
            description="Pay a one-time network fee to deploy your safe onchain"
            icon={SafeLogo}
            onClick={onActivateSafe}
          />
        </div>

        <div>
          <ChoiceButton
            title="Add another signer"
            description="Improve the security of your Safe account"
            icon={SaveAddressIcon}
            onClick={onAddSigner}
          />
        </div>

        {showRecoveryOption && (
          <div>
            <ChoiceButton
              title="Set up recovery"
              description="Ensure you never lose access to your funds"
              icon={RecoveryPlus}
              onClick={onRecovery}
            />
          </div>
        )}

        <div>
          <ChoiceButton
            title="Swap tokens"
            description="Explore Safe Apps and trade any token"
            icon={SwapIcon}
            onClick={onSwap}
          />
        </div>

        {showCustomTransaction && (
          <div>
            <ChoiceButton
              title="Custom transaction"
              description="Compose custom contract interactions"
              icon={Wrench}
              onClick={onCustomTransaction}
            />
          </div>
        )}

        <div>
          <ChoiceButton title="Send token" icon={AssetsIcon} onClick={onSendToken} />
        </div>
      </div>
    </ModalDialog>
  )
}
