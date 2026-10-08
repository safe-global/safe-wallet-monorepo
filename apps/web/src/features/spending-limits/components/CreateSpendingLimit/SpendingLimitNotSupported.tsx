import ErrorMessage from '@/components/tx/ErrorMessage'
import { useCurrentChain } from '@/hooks/useChains'
import { SpendingLimitNotSupportedView } from '@views/features/spending-limits/components/CreateSpendingLimit/SpendingLimitNotSupportedView'

const SpendingLimitNotSupported = () => {
  const chain = useCurrentChain()

  return (
    <SpendingLimitNotSupportedView
      chainName={chain?.chainName}
      renderErrorMessage={(children) => <ErrorMessage>{children}</ErrorMessage>}
    />
  )
}

export default SpendingLimitNotSupported
