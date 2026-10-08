import AddAccountsChooser from '@/components/common/AddAccountsChooser'
import { useDarkMode } from '@/hooks/useDarkMode'
import { TrustedAccountsActionsView } from '@views/features/myAccounts/components/MyAccountsV2/components/TrustedAccountsActions/TrustedAccountsActionsView'

/**
 * Action buttons on the trusted-accounts panel: open the "Add accounts" chooser
 * (watch existing / create new) and manage the trusted list. Sits top-right
 * inside the panel per the redesign.
 */
const TrustedAccountsActions = ({ onManage, onLinkClick }: { onManage: () => void; onLinkClick?: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <TrustedAccountsActionsView
      isDarkMode={isDarkMode}
      onManage={onManage}
      renderAddAccountsChooser={(props) => <AddAccountsChooser onLinkClick={onLinkClick} {...props} />}
    />
  )
}

export default TrustedAccountsActions
