import { LogBox, Pressable } from 'react-native'
import { View } from 'tamagui'
import { useDispatch } from 'react-redux'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { useRouter } from 'expo-router'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeInfo, Address } from '@/src/types/address'
import { updateSettings } from '@/src/store/settingsSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addContact } from '@/src/store/addressBookSlice'
import { addSigner } from '@/src/store/signersSlice'
import { setActiveSigner } from '@/src/store/activeSignerSlice'

LogBox.ignoreAllLogs()

const mockedActiveAccount: SafeInfo = {
  address: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6',
  chainId: '11155111',
}
const mockedActiveSafeInfo: SafeOverview = {
  address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
    { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
    { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

const mockedActiveAccount1: SafeInfo = {
  address: '0x9BFCA75a05175503580D593F4330b5505c594596',
  chainId: '11155111',
}
const mockedActiveSafeInfo1: SafeOverview = {
  address: { value: '0x9BFCA75a05175503580D593F4330b5505c594596', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount1.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0', name: null, logoUri: null },
    { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
    { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

const mockedSwapOrderAccount: SafeInfo = {
  address: '0x03042B890b99552b60A073F808100517fb148F60',
  chainId: '11155111',
}
const mockedSwapOrderSafeInfo: SafeOverview = {
  address: { value: '0x03042B890b99552b60A073F808100517fb148F60', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedSwapOrderAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0', name: null, logoUri: null },
    { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

const assetsTest: { safes: Record<string, SafeOverview> } = {
  safes: {
    Safe1: {
      address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
        { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
        { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
    Safe2: {
      address: { value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872', name: null, logoUri: null },
        { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
  },
}

const mockedTxHistoryAccount: SafeInfo = {
  address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  chainId: '11155111',
}
const mockedTxHistorySafeInfo: SafeOverview = {
  address: { value: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedTxHistoryAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x4fe7164d7cA511Ab35520bb14065F1693240dC90', name: null, logoUri: null },
    { value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED', name: null, logoUri: null },
    { value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

const mockedStakeDepositAccount: SafeInfo = {
  address: '0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B',
  chainId: '11155111',
}
const mockedStakeDepositSafeInfo: SafeOverview = {
  address: { value: '0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedStakeDepositAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x4fe7164d7cA511Ab35520bb14065F1693240dC90', name: null, logoUri: null },
    { value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED', name: null, logoUri: null },
    { value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

// Mocked signer address for pending tx tests
const mockedPendingTxSignerAddress = '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED'

// Pending transaction test safes
const pendingTxSafe1: SafeInfo = {
  address: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
  chainId: '11155111',
}
const pendingTxSafeInfo1: SafeOverview = {
  address: { value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe1.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

const pendingTxSafe2: SafeInfo = {
  address: '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2',
  chainId: '11155111',
}
const pendingTxSafeInfo2: SafeOverview = {
  address: { value: '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe2.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

const pendingTxSafe3: SafeInfo = {
  address: '0xc36A530ccD728d36a654ccedEB7994473474C018',
  chainId: '11155111',
}
const pendingTxSafeInfo3: SafeOverview = {
  address: { value: '0xc36A530ccD728d36a654ccedEB7994473474C018', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe3.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

const pendingTxSafe4: SafeInfo = {
  address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  chainId: '11155111',
}
const pendingTxSafeInfo4: SafeOverview = {
  address: { value: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe4.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

const pendingTxSafe5: SafeInfo = {
  address: '0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe',
  chainId: '11155111',
}
const pendingTxSafeInfo5: SafeOverview = {
  address: { value: '0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe5.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

const pendingTxSafe6: SafeInfo = {
  address: '0xAC456f5422C13b93d4ac819c3E52bA418E401EaA',
  chainId: '11155111',
}
const pendingTxSafeInfo6: SafeOverview = {
  address: { value: '0xAC456f5422C13b93d4ac819c3E52bA418E401EaA', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe6.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */

const BTN = { height: 1, width: 1, backgroundColor: 'red' }

export function TestCtrls() {
  const dispatch = useDispatch()
  const router = useRouter()
  const onPressOnboardedAccount = async () => {
    dispatch(
      addSafe({
        address: mockedActiveSafeInfo.address.value as Address,
        info: { [mockedActiveSafeInfo.chainId]: mockedActiveSafeInfo },
      }),
    )
    dispatch(setActiveSafe(mockedActiveAccount))
    dispatch(updatePromptAttempts(1))
    router.replace('/(tabs)')
  }
  const onPressTestOnboarding = async () => {
    router.replace('/onboarding')
  }

  const onPressE2eHistory = async () => {
    dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
    dispatch(updatePromptAttempts(1))
    dispatch(
      addSafe({
        info: { [mockedActiveAccount1.chainId]: mockedActiveSafeInfo1 },
        address: mockedActiveAccount1.address,
      }),
    )
    dispatch(setActiveSafe(mockedActiveAccount1))

    router.replace('/(tabs)')
  }

  const onPressE2eTransactionHistory = async () => {
    dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
    dispatch(updatePromptAttempts(1))
    dispatch(
      addSafe({
        info: { [mockedTxHistoryAccount.chainId]: mockedTxHistorySafeInfo },
        address: mockedTxHistoryAccount.address,
      }),
    )

    dispatch(
      addContact({
        value: mockedTxHistoryAccount.address,
        name: 'History Safe',
        chainIds: [mockedTxHistoryAccount.chainId],
      }),
    )

    // Add swap order safe with title
    dispatch(
      addSafe({
        info: { [mockedSwapOrderAccount.chainId]: mockedSwapOrderSafeInfo },
        address: mockedSwapOrderAccount.address,
      }),
    )
    dispatch(
      addContact({
        value: mockedSwapOrderAccount.address,
        name: 'Swap Test Safe',
        chainIds: [mockedSwapOrderAccount.chainId],
      }),
    )

    // Add stake deposit safe with title
    dispatch(
      addSafe({
        info: { [mockedStakeDepositAccount.chainId]: mockedStakeDepositSafeInfo },
        address: mockedStakeDepositAccount.address,
      }),
    )
    dispatch(
      addContact({
        value: mockedStakeDepositAccount.address,
        name: 'Stake Deposit Safe',
        chainIds: [mockedStakeDepositAccount.chainId],
      }),
    )
    dispatch(setActiveSafe(mockedTxHistoryAccount))

    router.replace('/(tabs)')
  }

  const onPressE2ePendingTxs = async () => {
    dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
    dispatch(updatePromptAttempts(1))

    // Add the mocked signer
    const mockedSigner = {
      value: mockedPendingTxSignerAddress,
      name: null,
      logoUri: null,
      type: 'private-key' as const,
    }
    dispatch(addSigner(mockedSigner))
    dispatch(
      addContact({
        value: mockedPendingTxSignerAddress,
        name: `Signer-${mockedPendingTxSignerAddress.slice(-4)}`,
        chainIds: [],
      }),
    )

    // Add all pending tx safes
    const pendingTxSafes = [
      { account: pendingTxSafe1, info: pendingTxSafeInfo1, name: 'Pending Tx Safe 1' },
      { account: pendingTxSafe2, info: pendingTxSafeInfo2, name: 'Pending Tx Safe 2' },
      { account: pendingTxSafe3, info: pendingTxSafeInfo3, name: 'Pending Tx Safe 3' },
      { account: pendingTxSafe4, info: pendingTxSafeInfo4, name: 'Pending Tx Safe 4' },
      { account: pendingTxSafe5, info: pendingTxSafeInfo5, name: 'Pending Tx Safe 5' },
      { account: pendingTxSafe6, info: pendingTxSafeInfo6, name: 'Pending Tx Safe 6' },
    ]

    for (const { account, info, name } of pendingTxSafes) {
      dispatch(
        addSafe({
          info: { [account.chainId]: info },
          address: account.address,
        }),
      )
      dispatch(
        addContact({
          value: account.address,
          name,
          chainIds: [account.chainId],
        }),
      )
      // Set the signer as active for each safe
      dispatch(
        setActiveSigner({
          safeAddress: account.address,
          signer: mockedSigner,
        }),
      )
    }

    // Set the first safe as active
    dispatch(setActiveSafe(pendingTxSafe1))

    router.replace('/(tabs)')
  }

  return (
    <View position={'absolute'} top={100} right={0} zIndex={99999}>
      <Pressable
        testID="e2eOnboardedAccount"
        onPress={() => onPressOnboardedAccount()}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable
        testID="e2eOnboardedAccountTestAssets"
        onPress={() => {
          const keys = Object.keys(assetsTest.safes)
          Object.values(assetsTest.safes).forEach((safe: SafeOverview, index) => {
            dispatch(
              addSafe({
                address: safe.address.value as Address,
                info: { [safe.chainId]: safe },
              }),
            )
            dispatch(
              addContact({
                value: safe.address.value as Address,
                name: keys[index],
                chainIds: [safe.chainId],
              }),
            )
          })
          dispatch(updatePromptAttempts(1))
          dispatch(setActiveSafe(mockedActiveAccount))
          router.replace('/(tabs)')
        }}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable testID="e2eTestOnboarding" onPress={onPressTestOnboarding} accessibilityRole="button" style={BTN} />
      <Pressable testID="e2eHistory" onPress={onPressE2eHistory} accessibilityRole="button" style={BTN} />
      <Pressable
        testID="e2eTransactionHistory"
        onPress={() => onPressE2eTransactionHistory()}
        accessibilityRole="button"
        style={BTN}
      />
      <Pressable testID="e2ePendingTxs" onPress={() => onPressE2ePendingTxs()} accessibilityRole="button" style={BTN} />
    </View>
  )
}
