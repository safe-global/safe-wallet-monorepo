import { jsonToCSV } from 'react-papaparse'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
// import EthHashInfo from '@/components/common/EthHashInfo'
import { ReplaceOwnerFlow, RemoveOwnerFlow } from '@/components/tx-flow/flows'
import useAddressBook from '@/hooks/useAddressBook'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useContext, useMemo, type ReactElement } from 'react'
import { EditOwnerDialog } from '../EditOwnerDialog'
import { ManageSignersFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import type { AddressBook } from '@/store/addressBookSlice'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { OwnerListView } from '@views/components/settings/owner/OwnerList/OwnerListView'

const renderCheckWallet = (render: (isOk: boolean) => ReactElement) => <CheckWallet>{render}</CheckWallet>

export const OwnerList = () => {
  const addressBook = useAddressBook()
  const { safe } = useSafeInfo()
  const { setTxFlow } = useContext(TxModalContext)

  const items = useMemo(() => {
    return safe.owners.map((owner) => {
      const address = owner.value
      const name = addressBook[address]

      return {
        address,
        ownerInfo: <NamedAddressInfo address={address} showCopyButton shortAddress={false} name={name} hasExplorer />,
        editDialog: <EditOwnerDialog address={address} name={name} chainId={safe.chainId} />,
        onReplace: () => setTxFlow(<ReplaceOwnerFlow address={address} />),
        onRemove: () => setTxFlow(<RemoveOwnerFlow name={name} address={address} />),
      }
    })
  }, [safe.owners, safe.chainId, addressBook, setTxFlow])

  return (
    <OwnerListView
      items={items}
      showRemoveOwnerButton={safe.owners.length > 1}
      renderCheckWallet={renderCheckWallet}
      onManageSigners={() => setTxFlow(<ManageSignersFlow />)}
      onExport={() => exportOwners(safe, addressBook)}
    />
  )
}

function exportOwners(
  { chainId, address, owners }: Pick<SafeState, 'chainId' | 'address' | 'owners'>,
  addressBook: AddressBook,
) {
  const json = owners.map((owner) => {
    const address = owner.value
    const name = addressBook[address] || owner.name
    return [address, name]
  })

  const csv = jsonToCSV(json)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  Object.assign(link, {
    download: `${chainId}-${address.value}-signers.csv`,
    href: window.URL.createObjectURL(blob),
  })

  link.click()
}
