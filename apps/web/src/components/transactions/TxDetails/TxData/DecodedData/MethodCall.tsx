import NamedAddressInfo from '@/components/common/NamedAddressInfo'

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
    <div className="flex flex-wrap items-center gap-2 font-bold md:flex-nowrap">
      Call
      <code className="bg-[var(--color-background-main)] whitespace-nowrap rounded-sm px-2 py-1 font-mono text-sm font-normal">
        {method}
      </code>{' '}
      on
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
    </div>
  )
}

export default MethodCall
