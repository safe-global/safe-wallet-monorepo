import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { useState, useEffect } from 'react'
import type { Dispatch, ReactElement, SetStateAction, SyntheticEvent } from 'react'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import { multiSendDefaultsToSelf, resolveMultiSendToAddress } from '@safe-global/utils/utils/multiSend'
import {
  MultisendActionsHeaderView,
  MultisendView,
  type MultisendItemProps,
} from '@views/components/transactions/TxDetails/TxData/DecodedData/Multisend/MultisendView'

type MultisendProps = {
  txData?: TransactionData | null
  compact?: boolean
  isExecuted?: boolean
  // The Safe executing the batch, i.e. MultiSend's `address(this)`. Defaults to the connected Safe;
  // pass explicitly when rendering a nested Safe's batch where it is not the connected Safe.
  executingSafeAddress?: string
}

export const MultisendActionsHeader = ({
  setOpen,
  amount,
  compact = false,
  title,
}: {
  setOpen: Dispatch<SetStateAction<Record<number, boolean> | undefined>>
  amount: number
  compact?: boolean
  title?: string
}) => {
  const onClickAll = (expanded: boolean) => () => {
    setOpen(Array(amount).fill(expanded))
  }

  return (
    <MultisendActionsHeaderView
      onExpandAll={onClickAll(true)}
      onCollapseAll={onClickAll(false)}
      compact={compact}
      title={title}
    />
  )
}

const Multisend = ({
  txData,
  compact = false,
  isExecuted = false,
  executingSafeAddress,
}: MultisendProps): ReactElement | null => {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>()
  const isOpenMapUndefined = openMap == null
  const connectedSafeAddress = useSafeAddress()
  const safeAddress = executingSafeAddress || connectedSafeAddress
  const chainId = useChainId()
  // Only MultiSend v1.5.0+ defaults a zero-address sub-transaction `to` to the executing Safe.
  const multiSendAddress = txData?.to?.value
  const defaultsToSelf = !!multiSendAddress && multiSendDefaultsToSelf(multiSendAddress, chainId)

  // multiSend method receives one parameter `transactions`
  const multiSendTransactions = txData?.dataDecoded?.parameters?.[0].valueDecoded

  useEffect(() => {
    // Initialise whether each transaction should be expanded or not
    if (isOpenMapUndefined && Array.isArray(multiSendTransactions)) {
      setOpenMap(multiSendTransactions.map(({ operation }) => operation === Operation.DELEGATE))
    }
  }, [multiSendTransactions, isOpenMapUndefined])

  if (!multiSendTransactions) return null

  const renderItems = ({ variant, radius }: MultisendItemProps) =>
    Array.isArray(multiSendTransactions) &&
    multiSendTransactions.map(({ dataDecoded, data, value, to: rawTo, operation }, index) => {
      const to = defaultsToSelf ? resolveMultiSendToAddress(rawTo, safeAddress) : rawTo

      const onChange = (_: SyntheticEvent, expanded: boolean) => {
        setOpenMap((prev) => ({
          ...prev,
          [index]: expanded,
        }))
      }

      return (
        <SingleTxDecoded
          key={`${data ?? to}-${index}`}
          tx={{
            dataDecoded,
            data,
            value,
            to,
            operation,
          }}
          txData={txData}
          actionTitle={`${index + 1}`}
          variant={variant}
          radius={radius}
          expanded={openMap?.[index] ?? false}
          onChange={onChange}
          isExecuted={isExecuted}
        />
      )
    })

  return (
    <MultisendView
      header={
        <MultisendActionsHeader
          setOpen={setOpenMap}
          amount={Array.isArray(multiSendTransactions) ? multiSendTransactions.length : 0}
          compact={compact}
        />
      }
      compact={compact}
      renderItems={renderItems}
    />
  )
}

export default Multisend
