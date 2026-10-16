import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createTx from '../pages/create_tx.pages'
import * as tx from '../pages/transactions.page'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { createSigners } from '../../support/api/utils_ether'
import { createSafes } from '../../support/api/utils_protocolkit'
import * as wallet from '../../support/utils/wallet.js'
import * as ls from '../../support/localstorage_data.js'
import * as navigation from '../pages/navigation.page.js'
import * as fundSafes from '../../fixtures/safes/funds.json'
import { walletCredentials } from '../../support/credentials.js'

let receiver, signer
before(() => {
  receiver = walletCredentials.OWNER_2_WALLET_ADDRESS
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})

const tokenAmount = '0.0001'
const netwrok = 'sepolia'
const unit_eth = 'ether'
const proposeTimeout = 120000
let apiKit,
  protocolKitOwnerS1,
  protocolKitOwnerS2,
  protocolKitOwner1_S3,
  protocolKitOwner2_S3,
  existingSafeAddress1,
  existingSafeAddress2,
  existingSafeAddress3

let safes = []
let safesData = []

let provider, privateKeys, owner1Signer
before(() => {
  privateKeys = [walletCredentials.OWNER_1_PRIVATE_KEY, walletCredentials.OWNER_2_PRIVATE_KEY]
  cy.env(['INFURA_API_KEY']).then(({ INFURA_API_KEY }) => {
    provider = new ethers.InfuraProvider(netwrok, INFURA_API_KEY)
    ;[owner1Signer] = createSigners(privateKeys, provider)
  })
})

async function proposeNativeTransfer(protocolKit, safeAddress) {
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [{ to: receiver, data: '0x', value: ethers.parseUnits(tokenAmount, unit_eth).toString() }],
  })
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
  const senderSignature = await protocolKit.signHash(safeTxHash)

  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: await owner1Signer.getAddress(),
    senderSignature: senderSignature.data,
  })
  return safeTxHash
}

describe('Send funds from queue happy path tests 1', () => {
  before(async () => {
    cy.clearLocalStorage().then(() => {
      main.addToLocalStorage(constants.localStorageKeys.SAFE_v2_cookies, ls.cookies.acceptedCookies)
      main.addToLocalStorage(
        constants.localStorageKeys.SAFE_v2__tokenlist_onboarding,
        ls.cookies.acceptedTokenListOnboarding,
      )
    })

    safesData = fundSafes
    apiKit = new SafeApiKit({
      chainId: BigInt(1),
      txServiceUrl: constants.stagingTxServiceUrl,
    })

    existingSafeAddress1 = safesData.SEP_FUNDS_SAFE_3.substring(4)
    existingSafeAddress2 = safesData.SEP_FUNDS_SAFE_4.substring(4)
    existingSafeAddress3 = safesData.SEP_FUNDS_SAFE_5.substring(4)

    const safeConfigurations = [
      { signer: privateKeys[0], safeAddress: existingSafeAddress1, provider },
      { signer: privateKeys[0], safeAddress: existingSafeAddress2, provider },
      { signer: privateKeys[0], safeAddress: existingSafeAddress3, provider },
      { signer: privateKeys[1], safeAddress: existingSafeAddress3, provider },
    ]

    safes = await createSafes(safeConfigurations)

    protocolKitOwnerS1 = safes[0]
    protocolKitOwnerS2 = safes[1]
    protocolKitOwner1_S3 = safes[2]
    protocolKitOwner2_S3 = safes[3]
  })

  it('Verify confirmation and execution of native token queued tx by second signer with connected wallet', () => {
    const safe = safesData.SEP_FUNDS_SAFE_3

    main.fetchCurrentNonce(safe).then((currentNonce) => {
      cy.wrap(null).then({ timeout: proposeTimeout }, () =>
        proposeNativeTransfer(protocolKitOwnerS1, existingSafeAddress1),
      )
      wallet.connectSignerViaStorage(signer, constants.transactionQueueUrl + safe)
      createTx.clickOnConfirmBtn(0)
      tx.signAndExecuteWithConnectedWallet()

      main.verifyNonceChange(safe, currentNonce + 1)
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
    })
  })

  it('Verify 1 signer can execute a tx confirmed by 2 signers', { defaultCommandTimeout: 300000 }, () => {
    const safe = safesData.SEP_FUNDS_SAFE_5

    main.fetchCurrentNonce(safe).then((currentNonce) => {
      cy.wrap(null).then({ timeout: proposeTimeout }, async () => {
        const safeTxHash = await proposeNativeTransfer(protocolKitOwner1_S3, existingSafeAddress3)
        const signature = await protocolKitOwner2_S3.signHash(safeTxHash)
        await apiKit.confirmTransaction(safeTxHash, signature.data)
      })
      wallet.connectSignerViaStorage(signer, constants.transactionQueueUrl + safe)
      createTx.clickOnExecuteBtn(0)
      tx.executeSignedTxWithConnectedWallet()

      main.verifyNonceChange(safe, currentNonce + 1)
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
    })
  })
})
