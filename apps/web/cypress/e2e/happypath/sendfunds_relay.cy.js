import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as assets from '../pages/assets.pages'
import * as loadsafe from '../pages/load_safe.pages'
import * as navigation from '../pages/navigation.page'
import * as tx from '../pages/transactions.page'
import * as nfts from '../pages/nfts.pages'
import * as ls from '../../support/localstorage_data.js'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { createSigners } from '../../support/api/utils_ether'
import { createSafes } from '../../support/api/utils_protocolkit'
import { contracts, abi_qtrust, abi_nft_pc2 } from '../../support/api/contracts'
import * as wallet from '../../support/utils/wallet.js'
import * as fundSafes from '../../fixtures/safes/funds.json'
import { walletCredentials } from '../../support/credentials.js'

const transferAmount = '1'

const tokenAmount2 = '0.00001'
const netwrok = 'sepolia'
const unit_eth = 'ether'
const onChainTimeout = 180000
let apiKit, protocolKitOwner1_S3, protocolKitOwner2_S3, outgoingSafeAddress

let safes = []
let safesData = []

const contractAddress = contracts.token_qtrust
const nftContractAddress = contracts.nft_pc2

let signer, provider, privateKeys, walletAddress, tokenContract, nftContract, owner1Signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
  privateKeys = [walletCredentials.OWNER_1_PRIVATE_KEY, walletCredentials.OWNER_2_PRIVATE_KEY]
  walletAddress = walletCredentials.OWNER_1_WALLET_ADDRESS
  cy.env(['INFURA_API_KEY']).then(({ INFURA_API_KEY }) => {
    provider = new ethers.InfuraProvider(netwrok, INFURA_API_KEY)
    ;[owner1Signer] = createSigners(privateKeys, provider)
    tokenContract = new ethers.Contract(contractAddress, abi_qtrust, provider)
    nftContract = new ethers.Contract(nftContractAddress, abi_nft_pc2, provider)
  })
})

function verifyRelayAttemptsLeft(safeAddress) {
  main.getRelayRemainingAttempts(safeAddress).then((remainingAttempts) => {
    if (remainingAttempts < 1) {
      throw new Error(main.noRelayAttemptsError)
    }
  })
}

async function returnNftToSafe(safeAddress, tokenId) {
  const holder = await nftContract.ownerOf(tokenId)
  if (holder.toLowerCase() !== walletAddress.toLowerCase()) return
  const transfer = await nftContract.connect(owner1Signer).safeTransferFrom(holder, safeAddress, tokenId, {
    gasLimit: 200000,
  })
  await transfer.wait()
}

async function returnTokenToSafe(safeAddress, amount) {
  const transfer = await tokenContract.connect(owner1Signer).transfer(safeAddress, amount, { gasLimit: 200000 })
  await transfer.wait()
}

async function refillFromOutgoingSafe(targetSafe, amount) {
  const safeTransaction = await protocolKitOwner1_S3.createTransaction({
    transactions: [{ to: targetSafe, data: '0x', value: amount }],
  })
  const safeTxHash = await protocolKitOwner1_S3.getTransactionHash(safeTransaction)
  const senderSignature = await protocolKitOwner1_S3.signHash(safeTxHash)

  await apiKit.proposeTransaction({
    safeAddress: outgoingSafeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: await owner1Signer.getAddress(),
    senderSignature: senderSignature.data,
  })

  const signature = await protocolKitOwner2_S3.signHash(safeTxHash)
  await apiKit.confirmTransaction(safeTxHash, signature.data)

  const safeTx = await apiKit.getTransaction(safeTxHash)
  await protocolKitOwner1_S3.executeTransaction(safeTx)
}

// TODO: Relay only allows 5 txs per day.
describe('Send funds with relay happy path tests', { defaultCommandTimeout: 300000 }, () => {
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

    outgoingSafeAddress = safesData.SEP_FUNDS_SAFE_8.substring(4)

    const safeConfigurations = [
      { signer: privateKeys[0], safeAddress: outgoingSafeAddress, provider },
      { signer: privateKeys[1], safeAddress: outgoingSafeAddress, provider },
    ]

    safes = await createSafes(safeConfigurations)

    protocolKitOwner1_S3 = safes[0]
    protocolKitOwner2_S3 = safes[1]
  })

  it('Verify tx creation and execution of NFT with relay', () => {
    const originatingSafe = safesData.SEP_FUNDS_SAFE_9
    const nftTokenId = 2

    verifyRelayAttemptsLeft(originatingSafe.substring(4))
    cy.wrap(null).then({ timeout: onChainTimeout }, () => returnNftToSafe(originatingSafe.substring(4), nftTokenId))
    main.fetchCurrentNonce(originatingSafe).then((currentNonce) => {
      wallet.connectSignerViaStorage(signer, constants.balanceNftsUrl + originatingSafe)
      nfts.selectNFTs(1)
      nfts.sendNFT()
      nfts.typeRecipientAddress(walletAddress)
      nfts.clikOnNextBtn()
      tx.signAndExecuteWithRelay()

      main.verifyNonceChange(originatingSafe, currentNonce + 1)
      cy.wrap(null).then({ timeout: onChainTimeout }, () => returnNftToSafe(originatingSafe.substring(4), nftTokenId))
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
    })
  })

  it('Verify tx creation and execution of native token with relay', () => {
    const targetSafe = safesData.SEP_FUNDS_SAFE_1

    verifyRelayAttemptsLeft(targetSafe.substring(4))
    main.fetchCurrentNonce(targetSafe).then((currentNonce) => {
      wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + targetSafe)
      assets.clickOnSendBtn(0)
      loadsafe.inputOwnerAddress(0, walletAddress)
      assets.checkSelectedToken(constants.tokenAbbreviation.sep)
      assets.enterAmount(tokenAmount2)
      navigation.clickOnNewTxBtnS()
      tx.signAndExecuteWithRelay()

      main.verifyNonceChange(targetSafe, currentNonce + 1)
      cy.wrap(null).then({ timeout: onChainTimeout }, () =>
        refillFromOutgoingSafe(targetSafe.substring(4), ethers.parseUnits(tokenAmount2, unit_eth).toString()),
      )
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
    })
  })

  it('Verify tx creation and execution of non-native token with with relay', () => {
    const originatingSafe = safesData.SEP_FUNDS_SAFE_2

    verifyRelayAttemptsLeft(originatingSafe.substring(4))
    main.fetchCurrentNonce(originatingSafe).then((currentNonce) => {
      wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + originatingSafe)
      assets.toggleShowAllTokens(true)
      assets.toggleHideDust(false)
      assets.clickOnSendBtn(1)
      loadsafe.inputOwnerAddress(0, walletAddress)
      assets.enterAmount(transferAmount)
      navigation.clickOnNewTxBtnS()
      tx.signAndExecuteWithRelay()

      main.verifyNonceChange(originatingSafe, currentNonce + 1)
      cy.wrap(null).then({ timeout: onChainTimeout }, () =>
        returnTokenToSafe(originatingSafe.substring(4), ethers.parseUnits(transferAmount, unit_eth)),
      )
      navigation.clickOnWalletExpandMoreIcon()
      navigation.clickOnDisconnectBtn()
    })
  })
})
