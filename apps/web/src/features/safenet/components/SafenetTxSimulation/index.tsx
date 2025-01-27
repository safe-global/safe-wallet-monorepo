import useDecodeTx from '@/hooks/useDecodeTx'
import CloseIcon from '@/public/images/common/close.svg'
import { useLazySimulateSafenetTxQuery } from '@/store/safenet'
import { hashTypedData } from '@/utils/web3'
import { CircularProgress, SvgIcon, Typography } from '@mui/material'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { useEffect, type ReactElement } from 'react'
import SafenetTxSimulationSummary from './SafenetTxSimulationSummary'

export type SafenetTxSimulationProps = {
  safe: string
  chainId: string
  safeTx?: SafeTransaction
}

function _getSafeTxHash({ safe, chainId, safeTx }: Required<SafenetTxSimulationProps>): string {
  return hashTypedData({
    domain: {
      chainId,
      verifyingContract: safe,
    },
    types: {
      SafeTx: [
        { type: 'address', name: 'to' },
        { type: 'uint256', name: 'value' },
        { type: 'bytes', name: 'data' },
        { type: 'uint8', name: 'operation' },
        { type: 'uint256', name: 'safeTxGas' },
        { type: 'uint256', name: 'baseGas' },
        { type: 'uint256', name: 'gasPrice' },
        { type: 'address', name: 'gasToken' },
        { type: 'address', name: 'refundReceiver' },
        { type: 'uint256', name: 'nonce' },
      ],
    },
    message: { ...safeTx.data },
  })
}

const SafenetTxSimulation = ({ safe, chainId, safeTx }: SafenetTxSimulationProps): ReactElement | null => {
  const [dataDecoded] = useDecodeTx(safeTx)
  const [simulate, { data: simulation, status }] = useLazySimulateSafenetTxQuery()

  useEffect(() => {
    if (!safeTx || !dataDecoded) {
      return
    }

    const safeTxHash = _getSafeTxHash({ safe, chainId, safeTx })
    simulate({
      chainId,
      tx: {
        safe,
        safeTxHash,
        to: safeTx.data.to,
        value: safeTx.data.value,
        data: safeTx.data.data,
        operation: safeTx.data.operation,
        safeTxGas: safeTx.data.safeTxGas,
        baseGas: safeTx.data.baseGas,
        gasPrice: safeTx.data.gasPrice,
        gasToken: safeTx.data.gasToken,
        refundReceiver: safeTx.data.refundReceiver,
        // We don't send confirmations, as we want to simulate the transaction before signing.
        // In the future, we can consider sending the already collected signatures, but this is not
        // necessary at the moment.
        confirmations: [],
        dataDecoded,
      },
    })
  }, [safe, chainId, safeTx, dataDecoded, simulate])

  switch (status) {
    case 'fulfilled':
      return <SafenetTxSimulationSummary simulation={simulation!} />
    case 'rejected':
      return (
        <Typography color="error">
          <SvgIcon component={CloseIcon} inheritViewBox fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Unexpected error simulating with Safenet!
        </Typography>
      )
    default:
      return <CircularProgress size={22} sx={{ color: ({ palette }) => palette.text.secondary }} />
  }
}

export default SafenetTxSimulation
