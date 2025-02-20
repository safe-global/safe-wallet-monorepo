import { Address } from '@/src/types/address'
import { SignForm } from './SignForm'
import React from 'react'

export interface SignFormContainerProps {
  address: Address
  name?: string
  txId?: string
}

// ---------------------------------------------------------------------------------------------------------------------
// Move to the another file. Something to manage wallet and rpc connections
// ---------------------------------------------------------------------------------------------------------------------

const temporary = async (transaction: TTxCardPress) => {
  const PRIVATE_KEY = 'PRIVATE_KEY'
  const wallet = new ethers.Wallet(PRIVATE_KEY)
  const provider = createWeb3ReadOnly(activeChain as ChainInfo)

  if (!provider) {
    return
  }

  const connectedWallet = wallet.connect(provider)
  const RPC_URL = provider._getConnection().url

  let protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
    safeAddress: activeSafe.address,
  })

  protocolKit = await protocolKit.connect({
    provider: RPC_URL,
    signer: PRIVATE_KEY,
  })

  // const safeTransactionData = {
  //   to: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
  //   value: '300000000000000000', // 0.01 ETH
  //   data: '0x',
  // }
  console.log('passou aqui')
  // let safeTransaction = await protocolKit.createTransaction({
  //   transactions: [safeTransactionData],
  // })

  // safeTransaction = await protocolKit.signTransaction(safeTransaction, SigningMethod.ETH_SIGN)

  // Get the signature from OWNER_1_ADDRESS
  // const signatureOwner1 = safeTransaction.getSignature(wallet.address) as EthSafeSignature

  // // Get the transaction hash of the safeTransaction
  // const safeTransactionHash = await protocolKit.getTransactionHash(safeTransaction)

  // Instantiate the API Kit
  // Use the chainId where you have the Safe account deployed
  const apiKit = new SafeApiKit({ chainId: BigInt(activeSafe.chainId) })

  // Get the tx details from the backend if not provided

  // Propose the transaction
  // const resp = await apiKit
  //   .proposeTransaction({
  //     safeAddress: activeSafe.address,
  //     safeTransactionData: safeTransaction.data,
  //     safeTxHash: safeTransactionHash,
  //     senderAddress: wallet.address,
  //     senderSignature: buildSignatureBytes([signatureOwner1]),
  //   })
  //   .catch(console.log)

  // const resp = await createExistingTx(activeSafe.chainId, activeSafe.address, tx.tx.id)

  // Convert them to the Core SDK tx params
  console.log('passou aqui 2')
  const txDetails = await getTransactionDetails(activeSafe.chainId, transaction.tx.id)
  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)
  console.log({ transactions: [txParams] })
  let safeTx = await protocolKit.createTransaction({ transactions: [txParams] }).catch(console.log)
  console.log({ safeTx })

  if (!safeTx) {
    return
  }

  safeTx = await protocolKit.signTransaction(safeTx, SigningMethod.ETH_SIGN)
  console.log({ safeTx })

  Object.entries(signatures).forEach(([signer, data]) => {
    safeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })
  const safeTransactionHash = await protocolKit.getTransactionHash(safeTx)

  const signature = safeTx.getSignature(wallet.address) as EthSafeSignature

  const resp = await apiKit.confirmTransaction(safeTransactionHash, buildSignatureBytes([signature])).catch((err) => {
    console.log('deu merda')
    console.log(err)
  })

  console.log(resp, 'resonse da transaction confirmada')

  const signedTransaction = await apiKit.getTransaction(safeTransactionHash).catch((err) => {
    console.log(err)
  })
  console.log(signedTransaction, 'signed transaction')
}

export function SignFormContainer({ address, name, txId }: SignFormContainerProps) {
  return <SignForm address={address} name={name} txId={txId} />
}
