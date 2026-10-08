import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { MethodCallView } from '@views/components/transactions/TxDetails/TxData/DecodedData/MethodCallView'

const MethodCall = ({
  method,
  contractAddress,
  contractName,
  contractLogo,
}: {
  method: string
  contractAddress: string
  contractName?: string | null
  contractLogo?: string | null
}) => {
  return (
    <MethodCallView
      method={method}
      contract={
        <NamedAddressInfo
          address={contractAddress}
          name={contractName}
          customAvatar={contractLogo}
          showAvatar
          onlyName
          hasExplorer
          showCopyButton
          avatarSize={24}
        />
      }
    />
  )
}

export default MethodCall
