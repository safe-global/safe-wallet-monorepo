import AddAccountsChooser from '../AddAccountsChooser'
import { useDarkMode } from '@/hooks/useDarkMode'
import { AddAccountsCardView } from '@views/features/spaces/components/Dashboard/AddAccountsCardView'

const AddAccountsCard = () => {
  const isDarkMode = useDarkMode()

  return (
    <AddAccountsCardView
      isDarkMode={isDarkMode}
      renderAddAccountsChooser={(props) => <AddAccountsChooser {...props} />}
    />
  )
}

export default AddAccountsCard
