import { AbiCoder, Interface, getBytes } from 'ethers'
import { BaseTransaction } from '@safe-global/safe-apps-sdk'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'

const abiCoder = AbiCoder.defaultAbiCoder()

const MULTI_SEND_ABI = [
  {
    name: 'multiSend',
    type: 'function',
    inputs: [{ type: 'bytes', name: 'transactions' }],
  },
]

const getMultiSendCallOnlyAddress = (chainId: string): string => {
  const deployment = getMultiSendCallOnlyDeployment({ network: chainId })

  if (!deployment) {
    throw new Error('MultiSendCallOnly deployment not found')
  }

  return deployment.networkAddresses[chainId]
}

const encodeMultiSendCall = (txs: BaseTransaction[]): string => {
  const joinedTxs = txs
    .map((tx) =>
      [
        abiCoder.encode(['uint8'], [0]).slice(-2),
        abiCoder.encode(['address'], [tx.to]).slice(-40),
        abiCoder.encode(['uint256'], [tx.value.toString()]).slice(-64),
        abiCoder.encode(['uint256'], [getBytes(tx.data).length]).slice(-64),
        tx.data.replace(/^0x/, ''),
      ].join(''),
    )
    .join('')

  const iface = new Interface(MULTI_SEND_ABI)
  const encodedMultiSendCallData = iface.encodeFunctionData('multiSend', [`0x${joinedTxs}`])

  return encodedMultiSendCallData
}

export { encodeMultiSendCall, getMultiSendCallOnlyAddress }
