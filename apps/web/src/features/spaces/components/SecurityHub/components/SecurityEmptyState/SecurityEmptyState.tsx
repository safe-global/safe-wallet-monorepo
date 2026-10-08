import { useCallback, useState, type ReactElement } from 'react'
import AddAccounts from '../../../AddAccounts'
import { HnSignupFlow } from '@/features/hypernative'
import { SecurityEmptyStateView } from '@views/features/spaces/components/SecurityHub/components/SecurityEmptyState/SecurityEmptyStateView'

const SecurityEmptyState = (): ReactElement => {
  const [isHnSignupOpen, setIsHnSignupOpen] = useState(false)

  const handleHypernativeClick = useCallback(() => {
    setIsHnSignupOpen(true)
  }, [])

  const handleHnSignupClose = useCallback(() => {
    setIsHnSignupOpen(false)
  }, [])

  return (
    <>
      <SecurityEmptyStateView
        onHypernativeClick={handleHypernativeClick}
        renderAddAccounts={(props) => <AddAccounts {...props} />}
      />

      <HnSignupFlow open={isHnSignupOpen} onClose={handleHnSignupClose} />
    </>
  )
}

export default SecurityEmptyState
