import AddAccountsChooser from '@/components/common/AddAccountsChooser'
import { useDarkMode } from '@/hooks/useDarkMode'
import { AddTrustedSafesCardView } from '@views/components/common/AddTrustedSafesCard/AddTrustedSafesCardView'

/**
 * Empty state shown when a wallet is connected but the user has not curated any
 * accounts yet. Offers the same two paths as the populated list toolbar: the
 * "Add accounts" chooser (watch existing / create new) and the "Manage list"
 * modal (via `onAdd`) to add existing accounts. Mirrors GetStartedCard so the
 * signed-in and signed-out empty states on the My accounts tab stay visually
 * consistent.
 */
const AddTrustedSafesCard = ({ onAdd, onLinkClick }: { onAdd: () => void; onLinkClick?: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <AddTrustedSafesCardView
      isDarkMode={isDarkMode}
      onAdd={onAdd}
      renderAddAccountsChooser={(slotProps) => <AddAccountsChooser {...slotProps} onLinkClick={onLinkClick} />}
    />
  )
}

export default AddTrustedSafesCard
